import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react';
import { loadState, saveState, resetState } from '../lib/storage';
import { CURRENT_USER, stageById } from '../data/mockData';

const StoreContext = createContext(null);

let eventSeq = 0;
const nextId = (prefix) => `${prefix}_${Date.now().toString(36)}_${++eventSeq}`;

function event(type, text, actor = CURRENT_USER.name, actorType = 'staff', meta = {}) {
  return { id: nextId('ev'), type, text, actor, actorType, at: new Date().toISOString(), ...meta };
}

function withApplicant(state, id, fn) {
  return {
    ...state,
    applicants: state.applicants.map((a) => (a.id === id ? fn(a) : a)),
  };
}

export function reducer(state, action) {
  switch (action.type) {
    // -- Applications ------------------------------------------------------
    case 'MOVE_STAGE': {
      const { id, stage, note, conditions } = action;
      return withApplicant(state, id, (a) => {
        if (a.stage === stage && !conditions) return a;
        const label = stageById(stage).label;
        return {
          ...a,
          stage,
          stageChangedAt: new Date().toISOString(),
          offerConditions: stage === 'offer_conditional' ? conditions ?? a.offerConditions : a.offerConditions,
          interviewDate: stage === 'interview' ? action.interviewDate ?? a.interviewDate : a.interviewDate,
          timeline: [...a.timeline, event('stage', note || `Stage changed to ${label}`, undefined, 'staff', { stage })],
        };
      });
    }

    case 'BULK_MOVE_STAGE': {
      const ids = new Set(action.ids);
      const label = stageById(action.stage).label;
      return {
        ...state,
        applicants: state.applicants.map((a) =>
          ids.has(a.id)
            ? {
                ...a,
                stage: action.stage,
                stageChangedAt: new Date().toISOString(),
                timeline: [...a.timeline, event('stage', `Stage changed to ${label} (bulk action)`, undefined, 'staff', { stage: action.stage })],
              }
            : a
        ),
      };
    }

    case 'ASSIGN_REVIEWER': {
      const ids = new Set(action.ids);
      const reviewer = state.reviewers.find((r) => r.id === action.reviewerId);
      return {
        ...state,
        applicants: state.applicants.map((a) =>
          ids.has(a.id)
            ? {
                ...a,
                assignedReviewer: action.reviewerId,
                timeline: [
                  ...a.timeline,
                  event('assignment', reviewer ? `Assigned to ${reviewer.name}` : 'Reviewer unassigned'),
                ],
              }
            : a
        ),
      };
    }

    case 'SET_DOC_STATUS': {
      const { id, docId, status, reason } = action;
      return withApplicant(state, id, (a) => {
        const doc = a.documents.find((d) => d.id === docId);
        if (!doc) return a;
        return {
          ...a,
          documents: a.documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  status,
                  rejectionReason: status === 'rejected' ? reason ?? d.rejectionReason : null,
                  replacementRequested: status === 'rejected' ? d.replacementRequested : false,
                  reviewedBy: CURRENT_USER.name,
                  reviewedAt: new Date().toISOString(),
                }
              : d
          ),
          timeline: [
            ...a.timeline,
            event(
              'document',
              status === 'approved'
                ? `Document approved: ${doc.name}`
                : status === 'rejected'
                  ? `Document rejected: ${doc.name} — ${reason}`
                  : `Document reset to pending: ${doc.name}`
            ),
          ],
        };
      });
    }

    case 'REQUEST_REPLACEMENT': {
      const { id, docId } = action;
      return withApplicant(state, id, (a) => {
        const doc = a.documents.find((d) => d.id === docId);
        if (!doc) return a;
        return {
          ...a,
          documents: a.documents.map((d) => (d.id === docId ? { ...d, replacementRequested: true } : d)),
          timeline: [...a.timeline, event('document', `Replacement requested from applicant: ${doc.name}`)],
        };
      });
    }

    case 'ADD_NOTE':
      return withApplicant(state, action.id, (a) => ({
        ...a,
        notes: [
          ...a.notes,
          {
            id: nextId('note'),
            author: CURRENT_USER.name,
            authorId: CURRENT_USER.id,
            role: CURRENT_USER.role,
            text: action.text,
            createdAt: new Date().toISOString(),
          },
        ],
        timeline: [...a.timeline, event('note', 'Internal note added')],
      }));

    case 'DELETE_NOTE':
      return withApplicant(state, action.id, (a) => ({
        ...a,
        notes: a.notes.filter((n) => n.id !== action.noteId),
      }));

    case 'LOG_EVENT':
      return withApplicant(state, action.id, (a) => ({
        ...a,
        timeline: [...a.timeline, event(action.eventType || 'action', action.text)],
      }));

    // -- Courses -----------------------------------------------------------
    case 'ADD_COURSE': {
      const id = nextId('course');
      return {
        ...state,
        courses: [
          ...state.courses,
          {
            id,
            currency: 'AUD',
            active: false, // new courses start unlisted until the detail page is filled in
            createdAt: new Date().toISOString(),
            intakes: [],
            requirements: {
              minGpa: 3.0,
              minIelts: 6.5,
              minIeltsBand: 6.0,
              minToefl: 79,
              minPte: 58,
              minDuolingo: 110,
              priorDegree: 'Bachelor degree in a related discipline',
              workExperienceYears: 0,
            },
            ...action.course,
          },
        ],
      };
    }

    case 'UPDATE_COURSE':
      return {
        ...state,
        courses: state.courses.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };

    case 'UPDATE_REQUIREMENTS':
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id === action.id ? { ...c, requirements: { ...c.requirements, ...action.patch } } : c
        ),
      };

    case 'UPDATE_INTAKE':
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id === action.courseId
            ? { ...c, intakes: c.intakes.map((i) => (i.id === action.intakeId ? { ...i, ...action.patch } : i)) }
            : c
        ),
      };

    case 'ADD_INTAKE':
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id === action.courseId ? { ...c, intakes: [...c.intakes, { ...action.intake, id: nextId('intake') }] } : c
        ),
      };

    case 'DELETE_INTAKE':
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id === action.courseId ? { ...c, intakes: c.intakes.filter((i) => i.id !== action.intakeId) } : c
        ),
      };

    // -- Scholarships ------------------------------------------------------
    case 'AWARD_SCHOLARSHIP': {
      const scheme = state.scholarships.find((s) => s.id === action.schemeId);
      const applicant = state.applicants.find((a) => a.id === action.applicantId);
      if (!scheme || !applicant) return state;
      const awarded = scheme.awards.filter((a) => a.status === 'awarded');
      if (awarded.length >= scheme.slotsTotal) return state;
      if (awarded.some((a) => a.applicantId === applicant.id)) return state;

      const course = state.courses.find((c) => c.id === applicant.courseId);
      const amount =
        scheme.type === 'percentage' ? Math.round(((course?.tuition ?? 0) * scheme.value) / 100) : scheme.value;

      return {
        ...state,
        scholarships: state.scholarships.map((s) =>
          s.id === scheme.id
            ? {
                ...s,
                budgetUsed: s.budgetUsed + amount,
                awards: [
                  ...s.awards,
                  {
                    id: nextId('award'),
                    applicantId: applicant.id,
                    applicantName: applicant.name,
                    amount,
                    awardedBy: CURRENT_USER.name,
                    awardedAt: new Date().toISOString(),
                    status: 'awarded',
                  },
                ],
              }
            : s
        ),
        applicants: state.applicants.map((a) =>
          a.id === applicant.id
            ? {
                ...a,
                scholarshipAwards: [...a.scholarshipAwards, { schemeId: scheme.id, schemeName: scheme.name, amount }],
                timeline: [...a.timeline, event('scholarship', `Awarded ${scheme.name}`)],
              }
            : a
        ),
      };
    }

    case 'REVOKE_AWARD': {
      const scheme = state.scholarships.find((s) => s.id === action.schemeId);
      const award = scheme?.awards.find((a) => a.id === action.awardId);
      if (!scheme || !award) return state;
      return {
        ...state,
        scholarships: state.scholarships.map((s) =>
          s.id === scheme.id
            ? {
                ...s,
                budgetUsed: Math.max(0, s.budgetUsed - award.amount),
                awards: s.awards.filter((a) => a.id !== award.id),
              }
            : s
        ),
        applicants: state.applicants.map((a) =>
          a.id === award.applicantId
            ? {
                ...a,
                scholarshipAwards: a.scholarshipAwards.filter((s) => s.schemeId !== scheme.id),
                timeline: [...a.timeline, event('scholarship', `${scheme.name} revoked`)],
              }
            : a
        ),
      };
    }

    case 'SAVE_SCHEME': {
      const exists = state.scholarships.some((s) => s.id === action.scheme.id);
      return {
        ...state,
        scholarships: exists
          ? state.scholarships.map((s) => (s.id === action.scheme.id ? { ...s, ...action.scheme } : s))
          : [...state.scholarships, { ...action.scheme, id: nextId('sch'), awards: [], budgetUsed: 0 }],
      };
    }

    // -- Communications ----------------------------------------------------
    case 'SAVE_TEMPLATE': {
      const exists = state.templates.some((t) => t.id === action.template.id);
      return {
        ...state,
        templates: exists
          ? state.templates.map((t) => (t.id === action.template.id ? { ...t, ...action.template } : t))
          : [...state.templates, { ...action.template, id: nextId('tpl') }],
      };
    }

    case 'SEND_MESSAGE': {
      const msg = {
        id: nextId('msg'),
        ...action.message,
        sentBy: CURRENT_USER.name,
        sentAt: new Date().toISOString(),
        status: 'sent',
      };
      const recipientIds = new Set(action.message.recipients.map((r) => r.id));
      return {
        ...state,
        messages: [msg, ...state.messages],
        applicants: state.applicants.map((a) =>
          recipientIds.has(a.id)
            ? { ...a, timeline: [...a.timeline, event('email', `Email sent: ${action.message.subject}`)] }
            : a
        ),
      };
    }

    // -- Saved views -------------------------------------------------------
    case 'SAVE_VIEW':
      return { ...state, savedViews: [...state.savedViews, { ...action.view, id: nextId('view') }] };

    case 'DELETE_VIEW':
      return { ...state, savedViews: state.savedViews.filter((v) => v.id !== action.id) };

    // -- University --------------------------------------------------------
    case 'UPDATE_UNIVERSITY':
      return { ...state, university: { ...state.university, ...action.patch } };

    case 'RESET':
      return resetState();

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  useEffect(() => {
    saveState(state);
  }, [state]);

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback(
    (message, opts = {}) => {
      const id = nextId('toast');
      setToasts((t) => [...t, { id, message, tone: opts.tone || 'success', description: opts.description }]);
      timers.current[id] = setTimeout(() => dismissToast(id), opts.duration ?? 4200);
      return id;
    },
    [dismissToast]
  );

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const value = useMemo(() => ({ state, dispatch, toast, toasts, dismissToast }), [state, toast, toasts, dismissToast]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AppProvider>');
  return ctx;
}

/** Convenience selectors — keep components free of lookup boilerplate. */
export function useCourse(courseId) {
  const { state } = useStore();
  return state.courses.find((c) => c.id === courseId);
}

export function useApplicant(id) {
  const { state } = useStore();
  return state.applicants.find((a) => a.id === id);
}

export function useLookups() {
  const { state } = useStore();
  return useMemo(() => {
    const courseById = Object.fromEntries(state.courses.map((c) => [c.id, c]));
    const intakeById = {};
    state.courses.forEach((c) => c.intakes.forEach((i) => (intakeById[i.id] = { ...i, courseId: c.id })));
    const reviewerById = Object.fromEntries(state.reviewers.map((r) => [r.id, r]));
    return { courseById, intakeById, reviewerById };
  }, [state.courses, state.reviewers]);
}
