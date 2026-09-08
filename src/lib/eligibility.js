/**
 * Eligibility engine.
 *
 * Compares a single applicant against the *live* entry requirements stored on
 * the course they applied to. Nothing here is precomputed or cached — editing a
 * course's requirements changes every affected applicant's flag immediately.
 */

export const ELIGIBILITY = {
  meets: { id: 'meets', label: 'Meets requirements', tone: 'emerald' },
  borderline: { id: 'borderline', label: 'Borderline', tone: 'amber' },
  not_met: { id: 'not_met', label: 'Does not meet', tone: 'rose' },
};

// How far below a threshold still counts as "borderline" rather than a hard miss.
const TOLERANCE = {
  gpa: 0.2,
  ielts: 0.5,
  toefl: 6,
  pte: 4,
  duolingo: 10,
  work: 1,
};

function check({ id, label, required, actual, tolerance, format = (v) => v, unit = '', scale = '' }) {
  const shortfall = required - actual;
  const pass = shortfall <= 0;
  const borderline = !pass && shortfall <= tolerance;
  return {
    id,
    label,
    required,
    actual,
    unit,
    scale, // short qualifier shown beside the label, e.g. "of 4.0"
    // Bare numbers for side-by-side comparison; the *Text variants keep the unit
    // for prose contexts like tooltips and CSV.
    shortRequired: format(required),
    shortActual: format(actual),
    requiredText: `${format(required)}${unit}`,
    actualText: `${format(actual)}${unit}`,
    pass,
    borderline,
    shortfall: pass ? 0 : Number(shortfall.toFixed(2)),
    status: pass ? 'pass' : borderline ? 'borderline' : 'fail',
  };
}

/**
 * @returns {{status, label, tone, checks, failed, borderlineChecks, summary}}
 */
export function evaluateEligibility(applicant, course) {
  if (!course) {
    return {
      status: 'not_met',
      ...ELIGIBILITY.not_met,
      checks: [],
      failed: [],
      borderlineChecks: [],
      summary: 'Course not found',
    };
  }

  const req = course.requirements || {};
  const checks = [];

  // --- Academic -----------------------------------------------------------
  if (req.minGpa != null) {
    checks.push(
      check({
        id: 'gpa',
        label: 'Minimum GPA',
        required: req.minGpa,
        actual: applicant.gpa.value,
        tolerance: TOLERANCE.gpa,
        format: (v) => Number(v).toFixed(2),
        unit: ' / 4.0',
        scale: 'of 4.0',
      })
    );
  }

  // --- English ------------------------------------------------------------
  const test = applicant.englishTest;
  if (test) {
    if (test.type === 'IELTS') {
      if (req.minIelts != null) {
        checks.push(
          check({
            id: 'english_overall',
            label: 'IELTS overall',
            required: req.minIelts,
            actual: test.overall,
            tolerance: TOLERANCE.ielts,
            format: (v) => Number(v).toFixed(1),
          })
        );
      }
      if (req.minIeltsBand != null) {
        ['listening', 'reading', 'writing', 'speaking'].forEach((band) => {
          checks.push(
            check({
              id: `english_${band}`,
              label: `IELTS ${band}`,
              required: req.minIeltsBand,
              actual: test.bands[band],
              tolerance: TOLERANCE.ielts,
              format: (v) => Number(v).toFixed(1),
            })
          );
        });
      }
    } else if (test.type === 'TOEFL' && req.minToefl != null) {
      checks.push(
        check({ id: 'english_overall', label: 'TOEFL iBT total', required: req.minToefl, actual: test.overall, tolerance: TOLERANCE.toefl })
      );
    } else if (test.type === 'PTE' && req.minPte != null) {
      checks.push(
        check({ id: 'english_overall', label: 'PTE Academic overall', required: req.minPte, actual: test.overall, tolerance: TOLERANCE.pte })
      );
    } else if (test.type === 'Duolingo' && req.minDuolingo != null) {
      checks.push(
        check({ id: 'english_overall', label: 'Duolingo English Test', required: req.minDuolingo, actual: test.overall, tolerance: TOLERANCE.duolingo })
      );
    }
  } else {
    checks.push({
      id: 'english_overall',
      label: 'English proficiency',
      required: req.minIelts,
      actual: 0,
      unit: '',
      scale: '',
      shortRequired: String(req.minIelts ?? '—'),
      shortActual: '—',
      requiredText: String(req.minIelts ?? '—'),
      actualText: 'Not provided',
      pass: false,
      borderline: false,
      shortfall: req.minIelts ?? 0,
      status: 'fail',
    });
  }

  // --- Experience ---------------------------------------------------------
  if (req.workExperienceYears > 0) {
    checks.push(
      check({
        id: 'work',
        label: 'Work experience',
        required: req.workExperienceYears,
        actual: applicant.workExperienceYears || 0,
        tolerance: TOLERANCE.work,
        format: (v) => Number(v).toFixed(v % 1 === 0 ? 0 : 1),
        unit: ' yrs',
        scale: 'years',
      })
    );
  }

  // --- Prior qualification (informational, but can hard-fail if absent) ----
  if (req.priorDegree) {
    const hasQual = Boolean(applicant.priorDegree);
    checks.push({
      id: 'prior_degree',
      label: 'Prior qualification',
      required: req.priorDegree,
      actual: applicant.priorDegree,
      unit: '',
      scale: '',
      shortRequired: '—',
      shortActual: hasQual ? 'Provided' : 'Missing',
      requiredText: req.priorDegree,
      actualText: applicant.priorDegree || 'Not provided',
      pass: hasQual,
      borderline: false,
      shortfall: 0,
      status: hasQual ? 'pass' : 'fail',
      manualReview: hasQual,
    });
  }

  const failed = checks.filter((c) => c.status === 'fail');
  const borderlineChecks = checks.filter((c) => c.status === 'borderline');

  const status = failed.length ? 'not_met' : borderlineChecks.length ? 'borderline' : 'meets';

  const summary = failed.length
    ? `Fails ${failed.length} requirement${failed.length > 1 ? 's' : ''}: ${failed.map((c) => c.label).join(', ')}`
    : borderlineChecks.length
      ? `Within tolerance on ${borderlineChecks.map((c) => c.label).join(', ')}`
      : 'Meets all published entry requirements';

  return { status, ...ELIGIBILITY[status], checks, failed, borderlineChecks, summary };
}

/**
 * Scholarship matching. Same live-computation contract as eligibility.
 */
export function evaluateScholarship(applicant, scheme, course) {
  const c = scheme.criteria || {};
  const reasons = [];
  let eligible = true;

  if (c.minGpa != null && applicant.gpa.value < c.minGpa) {
    eligible = false;
    reasons.push(`GPA ${applicant.gpa.value.toFixed(2)} below minimum ${c.minGpa.toFixed(2)}`);
  }
  if (c.countries?.length && !c.countries.includes(applicant.countryCode)) {
    eligible = false;
    reasons.push(`Nationality ${applicant.nationality} not in scheme regions`);
  }
  if (c.courseIds?.length && !c.courseIds.includes(applicant.courseId)) {
    eligible = false;
    reasons.push('Course not covered by this scheme');
  }
  if (c.faculties?.length && course && !c.faculties.includes(course.faculty)) {
    eligible = false;
    reasons.push(`${course.faculty} not covered by this scheme`);
  }
  if (c.gender && applicant.gender !== c.gender) {
    eligible = false;
    reasons.push('Does not meet the scheme demographic criterion');
  }
  if (c.levels?.length && course && !c.levels.includes(course.level)) {
    eligible = false;
    reasons.push(`${course.level} level not covered`);
  }
  if (c.minEnglishIelts != null) {
    const t = applicant.englishTest;
    const equiv =
      t?.type === 'IELTS'
        ? t.overall
        : t?.type === 'TOEFL'
          ? toeflToIelts(t.overall)
          : t?.type === 'PTE'
            ? pteToIelts(t.overall)
            : t?.type === 'Duolingo'
              ? duolingoToIelts(t.overall)
              : 0;
    if (equiv < c.minEnglishIelts) {
      eligible = false;
      reasons.push(`English ${equiv.toFixed(1)} (IELTS equiv.) below ${c.minEnglishIelts.toFixed(1)}`);
    }
  }

  const alreadyAwarded = scheme.awards.some((a) => a.applicantId === applicant.id && a.status === 'awarded');
  const slotsLeft = scheme.slotsTotal - scheme.awards.filter((a) => a.status === 'awarded').length;

  return { eligible, reasons, alreadyAwarded, slotsLeft };
}

// Published concordance tables, rounded to the nearest half band.
export function toeflToIelts(score) {
  if (score >= 118) return 9.0;
  if (score >= 115) return 8.5;
  if (score >= 110) return 8.0;
  if (score >= 102) return 7.5;
  if (score >= 94) return 7.0;
  if (score >= 79) return 6.5;
  if (score >= 60) return 6.0;
  if (score >= 46) return 5.5;
  return 5.0;
}
export function pteToIelts(score) {
  if (score >= 86) return 8.5;
  if (score >= 79) return 8.0;
  if (score >= 73) return 7.5;
  if (score >= 65) return 7.0;
  if (score >= 58) return 6.5;
  if (score >= 50) return 6.0;
  if (score >= 42) return 5.5;
  return 5.0;
}
export function duolingoToIelts(score) {
  if (score >= 145) return 8.5;
  if (score >= 135) return 8.0;
  if (score >= 130) return 7.5;
  if (score >= 120) return 7.0;
  if (score >= 110) return 6.5;
  if (score >= 95) return 6.0;
  if (score >= 85) return 5.5;
  return 5.0;
}

export function ieltsEquivalent(test) {
  if (!test) return null;
  if (test.type === 'IELTS') return test.overall;
  if (test.type === 'TOEFL') return toeflToIelts(test.overall);
  if (test.type === 'PTE') return pteToIelts(test.overall);
  if (test.type === 'Duolingo') return duolingoToIelts(test.overall);
  return null;
}

/** Intake status is always derived from capacity + dates, never stored raw. */
export function intakeStatus(intake) {
  if (intake.manualStatus === 'closed') return { id: 'closed', label: 'Closed', tone: 'slate' };
  if (intake.filled >= intake.capacity) return { id: 'full', label: 'Full', tone: 'rose' };
  const now = Date.now();
  const open = new Date(intake.openDate).getTime();
  const close = new Date(intake.closeDate).getTime();
  if (now < open) return { id: 'upcoming', label: 'Not yet open', tone: 'sky' };
  if (now > close) return { id: 'closed', label: 'Closed', tone: 'slate' };
  return { id: 'open', label: 'Open', tone: 'emerald' };
}
