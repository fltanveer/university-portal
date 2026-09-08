/**
 * StudyFound — University Portal mock dataset.
 *
 * Everything is generated from a seeded PRNG so the dataset is stable across
 * reloads and machines, while dates stay relative to "now" so the portal always
 * looks freshly active.
 */

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260908);
const rint = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const round = (n, d = 1) => Number(n.toFixed(d));

const DAY = 86400000;
const NOW = Date.now();
const daysAgo = (n) => new Date(NOW - n * DAY).toISOString();
const daysAhead = (n) => new Date(NOW + n * DAY).toISOString();
const uid = (() => {
  let n = 1000;
  return (prefix) => `${prefix}_${++n}`;
})();

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------
export const STAGES = [
  { id: 'new', label: 'New', group: 'applied', tone: 'sky', order: 1 },
  { id: 'under_review', label: 'Under Review', group: 'review', tone: 'sky', order: 2 },
  { id: 'shortlisted', label: 'Shortlisted', group: 'review', tone: 'accent', order: 3 },
  { id: 'documents_requested', label: 'Docs Requested', group: 'review', tone: 'amber', order: 4 },
  { id: 'interview', label: 'Interview', group: 'review', tone: 'accent', order: 5 },
  { id: 'offer_conditional', label: 'Conditional Offer', group: 'offer', tone: 'royal', order: 6 },
  { id: 'offer_unconditional', label: 'Unconditional Offer', group: 'offer', tone: 'royal', order: 7 },
  { id: 'accepted', label: 'Offer Accepted', group: 'accepted', tone: 'emerald', order: 8 },
  { id: 'deposit_paid', label: 'Deposit Paid', group: 'deposit', tone: 'emerald', order: 9 },
  { id: 'waitlisted', label: 'Waitlisted', group: 'holding', tone: 'amber', order: 10 },
  { id: 'deferred', label: 'Deferred', group: 'holding', tone: 'slate', order: 11 },
  { id: 'rejected', label: 'Rejected', group: 'closed', tone: 'rose', order: 12 },
];

export const stageById = (id) => STAGES.find((s) => s.id === id) || STAGES[0];

export const FUNNEL_STEPS = [
  { id: 'applied', label: 'Applications', match: () => true },
  {
    id: 'review',
    label: 'Under Review',
    match: (a) => stageById(a.stage).order >= 2 && a.stage !== 'rejected',
  },
  { id: 'offer', label: 'Offers Made', match: (a) => stageById(a.stage).order >= 6 && stageById(a.stage).order <= 9 },
  { id: 'accepted', label: 'Accepted', match: (a) => ['accepted', 'deposit_paid'].includes(a.stage) },
  { id: 'deposit', label: 'Deposit Paid', match: (a) => a.stage === 'deposit_paid' },
];

export const REVIEWERS = [
  { id: 'u_sarah', name: 'Sarah Chen', role: 'Admissions Officer', initials: 'SC', email: 's.chen@unimelb.edu.au' },
  { id: 'u_marcus', name: 'Marcus Webb', role: 'Senior Assessor', initials: 'MW', email: 'm.webb@unimelb.edu.au' },
  { id: 'u_priya', name: 'Priya Raghavan', role: 'Regional Manager, South Asia', initials: 'PR', email: 'p.raghavan@unimelb.edu.au' },
  { id: 'u_daniel', name: 'Daniel Oyelaran', role: 'Assessor, Africa & LATAM', initials: 'DO', email: 'd.oyelaran@unimelb.edu.au' },
];

export const CURRENT_USER = REVIEWERS[0];

export const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
];

export const FACULTIES = [
  'Engineering & IT',
  'Business & Economics',
  'Health Sciences',
  'Arts & Design',
];

export const DOC_REJECTION_REASONS = [
  'Illegible or low-quality scan',
  'Document expired',
  'Missing official stamp or seal',
  'Incomplete — pages missing',
  'Name mismatch with passport',
  'Unofficial / unverified translation',
  'Wrong document type uploaded',
];

// ---------------------------------------------------------------------------
// University profile
// ---------------------------------------------------------------------------
export const UNIVERSITY = {
  id: 'uni_melbourne',
  name: 'University of Melbourne',
  shortName: 'Melbourne',
  logoText: 'UM',
  tagline: 'Australia’s leading research university, in the heart of Melbourne.',
  description:
    'Founded in 1853, the University of Melbourne is Australia’s highest-ranked university and a member of the Group of Eight. Our Parkville campus sits minutes from the Melbourne CBD and hosts more than 52,000 students from over 150 countries. We offer a distinctive "Melbourne Model" curriculum — broad undergraduate degrees followed by specialised graduate study — backed by world-class research infrastructure and one of the strongest graduate employment records in the Asia-Pacific.',
  location: { city: 'Melbourne', state: 'Victoria', country: 'Australia' },
  ranking: { world: 13, national: 1, source: 'QS World University Rankings 2026' },
  tuitionRange: { min: 34000, max: 52000, currency: 'AUD' },
  established: 1853,
  studentCount: 52400,
  intlStudentCount: 21300,
  website: 'unimelb.edu.au',
  contactEmail: 'international.admissions@unimelb.edu.au',
  accreditation: ['TEQSA Registered', 'Group of Eight', 'AACSB (Business)', 'Engineers Australia'],
  campusPhotos: [
    { id: 'ph1', label: 'Old Quadrangle', tone: 'brand' },
    { id: 'ph2', label: 'Baillieu Library', tone: 'royal' },
    { id: 'ph3', label: 'Engineering Precinct', tone: 'accent' },
    { id: 'ph4', label: 'South Lawn', tone: 'emerald' },
  ],
  whyStudyHere: [
    'Ranked #1 in Australia and #13 globally (QS 2026)',
    'Graduate employment rate of 92% within six months',
    'AUD 12M in dedicated international scholarships each year',
    'Two-year post-study work rights in Victoria',
    'Campus 10 minutes from Melbourne CBD by tram',
    'Dedicated international student support in 8 languages',
  ],
};

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------
const intakeTemplate = (term, year, openOffset, closeOffset, capacity, filled) => ({
  id: uid('intake'),
  term,
  year,
  label: `${term} ${year}`,
  openDate: daysAgo(openOffset),
  closeDate: closeOffset < 0 ? daysAgo(-closeOffset) : daysAhead(closeOffset),
  capacity,
  filled,
  manualStatus: null, // 'open' | 'closed' | null (auto)
});

const COURSE_SEED = [
  {
    code: 'MC-ENGSW',
    title: 'Master of Software Engineering',
    faculty: 'Engineering & IT',
    level: 'Master',
    duration: '2 years',
    tuition: 49600,
    description:
      'A professionally accredited masters for graduates moving into senior software roles. Covers distributed systems, machine learning engineering, secure architecture and a two-semester industry capstone with partners including Atlassian, REA Group and CSIRO.',
    requirements: {
      minGpa: 3.0,
      minIelts: 6.5,
      minIeltsBand: 6.0,
      minToefl: 79,
      minPte: 58,
      minDuolingo: 110,
      priorDegree: 'Bachelor in Computing, Engineering or related discipline',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 83, 90, 61],
      ['Semester 2', 2027, 8, 234, 60, 12],
      ['Semester 2', 2026, 300, -99, 80, 80],
    ],
  },
  {
    code: 'MC-DATASC',
    title: 'Master of Data Science',
    faculty: 'Engineering & IT',
    level: 'Master',
    duration: '2 years',
    tuition: 51200,
    description:
      'Builds deep statistical and computational capability across machine learning, causal inference, and large-scale data engineering. Students complete an applied research project with an industry or government partner in the final semester.',
    requirements: {
      minGpa: 3.2,
      minIelts: 6.5,
      minIeltsBand: 6.0,
      minToefl: 79,
      minPte: 58,
      minDuolingo: 115,
      priorDegree: 'Bachelor with a quantitative major (mathematics, statistics, computing)',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 83, 70, 48],
      ['Semester 2', 2027, 8, 234, 50, 7],
    ],
  },
  {
    code: 'BH-ENGCIV',
    title: 'Bachelor of Civil Engineering (Honours)',
    faculty: 'Engineering & IT',
    level: 'Bachelor',
    duration: '4 years',
    tuition: 46800,
    description:
      'Engineers Australia accredited undergraduate honours degree covering structural, geotechnical, transport and water engineering, with a compulsory 12-week industry placement.',
    requirements: {
      minGpa: 2.8,
      minIelts: 6.5,
      minIeltsBand: 6.0,
      minToefl: 79,
      minPte: 58,
      minDuolingo: 110,
      priorDegree: 'Senior secondary certificate with mathematics and physics',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 22, 120, 94],
      ['Semester 2', 2027, 8, 234, 80, 15],
    ],
  },
  {
    code: 'MC-CYBER',
    title: 'Master of Cybersecurity',
    faculty: 'Engineering & IT',
    level: 'Master',
    duration: '1.5 years',
    tuition: 50400,
    description:
      'Specialist coursework masters in offensive and defensive security, cryptographic systems, digital forensics and security governance, delivered with the Defence Science Institute.',
    requirements: {
      minGpa: 3.0,
      minIelts: 7.0,
      minIeltsBand: 6.5,
      minToefl: 94,
      minPte: 65,
      minDuolingo: 120,
      priorDegree: 'Bachelor in Computing, IT or Engineering',
      workExperienceYears: 1,
    },
    intakes: [
      ['Semester 1', 2027, 100, 83, 45, 45],
      ['Semester 2', 2027, 8, 234, 45, 6],
    ],
  },
  {
    code: 'MC-MGMT',
    title: 'Master of Management (Finance)',
    faculty: 'Business & Economics',
    level: 'Master',
    duration: '2 years',
    tuition: 52000,
    description:
      'AACSB-accredited pre-experience masters for graduates entering corporate finance, investment banking and asset management. Includes CFA Level I curriculum alignment and a live portfolio management unit.',
    requirements: {
      minGpa: 3.2,
      minIelts: 6.5,
      minIeltsBand: 6.0,
      minToefl: 79,
      minPte: 58,
      minDuolingo: 115,
      priorDegree: 'Bachelor degree in any discipline',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 83, 100, 72],
      ['Semester 2', 2027, 8, 234, 70, 11],
      ['Semester 2', 2026, 300, -99, 90, 90],
    ],
  },
  {
    code: 'MC-MBA',
    title: 'Master of Business Administration',
    faculty: 'Business & Economics',
    level: 'Master',
    duration: '1.5 years',
    tuition: 51800,
    description:
      'Full-time MBA at Melbourne Business School for experienced professionals, with international consulting projects and a leadership development stream running across all three semesters.',
    requirements: {
      minGpa: 3.0,
      minIelts: 7.0,
      minIeltsBand: 6.5,
      minToefl: 94,
      minPte: 65,
      minDuolingo: 125,
      priorDegree: 'Bachelor degree in any discipline',
      workExperienceYears: 3,
    },
    intakes: [
      ['Semester 1', 2027, 100, 37, 60, 39],
      ['Semester 2', 2027, 8, 234, 40, 4],
    ],
  },
  {
    code: 'BH-COMM',
    title: 'Bachelor of Commerce',
    faculty: 'Business & Economics',
    level: 'Bachelor',
    duration: '3 years',
    tuition: 44900,
    description:
      'Flagship undergraduate business degree with majors in accounting, economics, finance, management and marketing, plus a required breadth component from outside the faculty.',
    requirements: {
      minGpa: 2.7,
      minIelts: 6.5,
      minIeltsBand: 6.0,
      minToefl: 79,
      minPte: 58,
      minDuolingo: 105,
      priorDegree: 'Senior secondary certificate with mathematics',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 83, 150, 118],
      ['Semester 2', 2027, 8, 234, 110, 19],
    ],
  },
  {
    code: 'MC-PUBHLTH',
    title: 'Master of Public Health',
    faculty: 'Health Sciences',
    level: 'Master',
    duration: '2 years',
    tuition: 47500,
    description:
      'Interdisciplinary masters covering epidemiology, biostatistics, health economics and global health policy, with a supervised placement in a health service or NGO.',
    requirements: {
      minGpa: 3.0,
      minIelts: 6.5,
      minIeltsBand: 6.0,
      minToefl: 79,
      minPte: 58,
      minDuolingo: 110,
      priorDegree: 'Bachelor in health, science or social science',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 52, 80, 51],
      ['Semester 2', 2027, 8, 234, 55, 9],
    ],
  },
  {
    code: 'MC-NURS',
    title: 'Master of Nursing Science',
    faculty: 'Health Sciences',
    level: 'Master',
    duration: '2 years',
    tuition: 48200,
    description:
      'Graduate-entry pathway to registration as a nurse in Australia, accredited by ANMAC. Includes 840 hours of supervised clinical placement across acute, community and mental health settings.',
    requirements: {
      minGpa: 3.0,
      minIelts: 7.0,
      minIeltsBand: 7.0,
      minToefl: 94,
      minPte: 65,
      minDuolingo: 125,
      priorDegree: 'Bachelor degree with human biology or anatomy & physiology',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 83, 50, 50],
      ['Semester 2', 2027, 8, 234, 40, 5],
    ],
  },
  {
    code: 'BH-BIOMED',
    title: 'Bachelor of Biomedicine',
    faculty: 'Health Sciences',
    level: 'Bachelor',
    duration: '3 years',
    tuition: 50100,
    description:
      'Rigorous undergraduate science degree and the primary pathway into the Doctor of Medicine, with majors spanning genetics, immunology, neuroscience and pharmacology.',
    requirements: {
      minGpa: 3.4,
      minIelts: 6.5,
      minIeltsBand: 6.0,
      minToefl: 79,
      minPte: 58,
      minDuolingo: 110,
      priorDegree: 'Senior secondary certificate with chemistry and mathematics',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 83, 90, 74],
      ['Semester 2', 2027, 8, 234, 60, 8],
    ],
  },
  {
    code: 'MC-ARCH',
    title: 'Master of Architecture',
    faculty: 'Arts & Design',
    level: 'Master',
    duration: '2 years',
    tuition: 45300,
    description:
      'Professionally accredited masters at the Melbourne School of Design. Studio-led, with vertical studios taught by practising architects and a research-driven final thesis project.',
    requirements: {
      minGpa: 3.0,
      minIelts: 6.5,
      minIeltsBand: 6.0,
      minToefl: 79,
      minPte: 58,
      minDuolingo: 110,
      priorDegree: 'Bachelor in architecture or design with portfolio',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 83, 55, 33],
      ['Semester 2', 2027, 8, 234, 35, 4],
      ['Semester 2', 2026, 300, -99, 50, 50],
    ],
  },
  {
    code: 'MC-INTREL',
    title: 'Master of International Relations',
    faculty: 'Arts & Design',
    level: 'Master',
    duration: '2 years',
    tuition: 43800,
    description:
      'Graduate program in diplomacy, security studies and international political economy, with an Indo-Pacific specialisation and optional internship at a mission or policy institute.',
    requirements: {
      minGpa: 2.9,
      minIelts: 6.5,
      minIeltsBand: 6.0,
      minToefl: 79,
      minPte: 58,
      minDuolingo: 105,
      priorDegree: 'Bachelor degree in any discipline',
      workExperienceYears: 0,
    },
    intakes: [
      ['Semester 1', 2027, 100, 83, 65, 29],
      ['Semester 2', 2027, 8, 234, 45, 6],
    ],
  },
];

export const COURSES = COURSE_SEED.map((c, i) => ({
  id: `course_${i + 1}`,
  ...c,
  currency: 'AUD',
  active: c.code !== 'MC-INTREL' ? true : true,
  createdAt: daysAgo(400 + i * 7),
  intakes: c.intakes.map(([term, year, openOffset, closeOffset, capacity, filled]) =>
    intakeTemplate(term, year, openOffset, closeOffset, capacity, filled)
  ),
}));

// ---------------------------------------------------------------------------
// Applicants
// ---------------------------------------------------------------------------
const NAME_POOL = {
  IN: [
    ['Aarav', 'Sharma', 'm'], ['Priya', 'Nair', 'f'], ['Rohan', 'Iyer', 'm'],
    ['Ananya', 'Reddy', 'f'], ['Vikram', 'Desai', 'm'], ['Meera', 'Krishnan', 'f'],
    ['Karthik', 'Subramanian', 'm'], ['Ishita', 'Banerjee', 'f'], ['Aditya', 'Rao', 'm'],
    ['Sneha', 'Pillai', 'f'], ['Rahul', 'Menon', 'm'], ['Divya', 'Chauhan', 'f'],
  ],
  BD: [
    ['Tanvir', 'Ahmed', 'm'], ['Nusrat', 'Jahan', 'f'], ['Rafiul', 'Islam', 'm'],
    ['Sadia', 'Rahman', 'f'], ['Mahmudul', 'Hasan', 'm'], ['Farhana', 'Akter', 'f'],
    ['Shakib', 'Chowdhury', 'm'], ['Tasnim', 'Haque', 'f'], ['Imran', 'Kabir', 'm'],
    ['Rumana', 'Sultana', 'f'],
  ],
  NG: [
    ['Chidi', 'Okonkwo', 'm'], ['Adaeze', 'Nwosu', 'f'], ['Emeka', 'Obi', 'm'],
    ['Ngozi', 'Adeyemi', 'f'], ['Oluwaseun', 'Adebayo', 'm'], ['Amaka', 'Eze', 'f'],
    ['Ibrahim', 'Musa', 'm'], ['Folake', 'Ogunleye', 'f'], ['Tunde', 'Bakare', 'm'],
    ['Chiamaka', 'Udoka', 'f'],
  ],
  VN: [
    ['Minh', 'Nguyen Van', 'm'], ['Mai', 'Tran Thi', 'f'], ['Nam', 'Le Hoang', 'm'],
    ['Ha', 'Pham Thu', 'f'], ['Huy', 'Vo Quang', 'm'], ['Lan', 'Do Ngoc', 'f'],
    ['Tuan', 'Bui Anh', 'm'], ['Chi', 'Dang Kim', 'f'], ['Chau', 'Ngo Bao', 'f'],
    ['Tung', 'Ly Thanh', 'm'],
  ],
  BR: [
    ['Lucas', 'Oliveira', 'm'], ['Mariana', 'Costa', 'f'], ['Rafael', 'Souza', 'm'],
    ['Beatriz', 'Almeida', 'f'], ['Gustavo', 'Pereira', 'm'], ['Camila', 'Ferreira', 'f'],
    ['Thiago', 'Ribeiro', 'm'], ['Larissa', 'Martins', 'f'], ['Felipe', 'Rocha', 'm'],
  ],
  PK: [
    ['Hassan', 'Raza', 'm'], ['Ayesha', 'Malik', 'f'], ['Bilal', 'Khan', 'm'],
    ['Zainab', 'Fatima', 'f'], ['Usman', 'Tariq', 'm'], ['Hira', 'Shahid', 'f'],
    ['Ali', 'Hamza', 'm'], ['Sana', 'Javed', 'f'], ['Fahad', 'Siddiqui', 'm'],
  ],
};

const DIAL_CODES = { IN: '+91', BD: '+880', NG: '+234', VN: '+84', BR: '+55', PK: '+92' };

const GPA_SYSTEMS = {
  IN: { system: 'CGPA (10-point)', scale: 10, convert: (g4) => round((g4 / 4) * 10, 2) },
  BD: { system: 'CGPA (4-point)', scale: 4, convert: (g4) => round(g4, 2) },
  NG: { system: 'CGPA (5-point)', scale: 5, convert: (g4) => round((g4 / 4) * 5, 2) },
  VN: { system: 'GPA (10-point)', scale: 10, convert: (g4) => round((g4 / 4) * 10, 2) },
  BR: { system: 'Nota (0–10)', scale: 10, convert: (g4) => round((g4 / 4) * 10, 2) },
  PK: { system: 'CGPA (4-point)', scale: 4, convert: (g4) => round(g4, 2) },
};

const PRIOR_DEGREES = {
  'Engineering & IT': [
    'B.Tech Computer Science & Engineering',
    'BSc Software Engineering',
    'B.E. Information Technology',
    'BSc Computer Science',
    'B.Tech Electronics & Communication',
  ],
  'Business & Economics': [
    'BBA Finance',
    'BCom Accounting',
    'BSc Economics',
    'BBA Marketing',
    'B.Com Business Administration',
  ],
  'Health Sciences': [
    'BSc Nursing',
    'BSc Biological Sciences',
    'MBBS (incomplete)',
    'BSc Public Health',
    'B.Pharm Pharmacy',
  ],
  'Arts & Design': [
    'B.Arch Architecture',
    'BA Political Science',
    'BDes Interior Architecture',
    'BA International Studies',
    'BFA Visual Communication',
  ],
};

const SECONDARY_QUALS = {
  IN: 'CBSE Senior Secondary Certificate (Class XII)',
  BD: 'Higher Secondary Certificate (HSC)',
  NG: 'WASSCE — West African Senior School Certificate',
  VN: 'Bằng Tốt nghiệp THPT (High School Graduation Diploma)',
  BR: 'Certificado de Ensino Médio + ENEM',
  PK: 'Higher Secondary School Certificate (HSSC)',
};

const INSTITUTIONS = {
  IN: ['VIT Vellore', 'Manipal Institute of Technology', 'Delhi Technological University', 'Anna University', 'SRM Institute of Science & Technology', 'Amity University Noida'],
  BD: ['BUET', 'North South University', 'University of Dhaka', 'BRAC University', 'Chittagong University of Engineering & Technology'],
  NG: ['University of Lagos', 'Covenant University', 'Ahmadu Bello University', 'Obafemi Awolowo University', 'University of Ibadan'],
  VN: ['Hanoi University of Science & Technology', 'Vietnam National University, Hanoi', 'RMIT University Vietnam', 'Ho Chi Minh City University of Technology', 'Foreign Trade University'],
  BR: ['Universidade de São Paulo', 'UNICAMP', 'Universidade Federal do Rio de Janeiro', 'PUC-Rio', 'Universidade Federal de Minas Gerais'],
  PK: ['NUST Islamabad', 'LUMS', 'University of the Punjab', 'GIK Institute', 'NED University of Engineering & Technology'],
};

const EMPLOYERS = {
  IN: ['Infosys', 'Tata Consultancy Services', 'Wipro Technologies', 'HDFC Bank', 'Apollo Hospitals', 'L&T Construction'],
  BD: ['Grameenphone', 'BRAC Bank', 'Square Pharmaceuticals', 'Therap BD', 'Robi Axiata'],
  NG: ['Andela', 'Guaranty Trust Bank', 'Dangote Group', 'Flutterwave', 'Nigerian National Petroleum Corp'],
  VN: ['FPT Software', 'Viettel Group', 'VNG Corporation', 'Techcombank', 'Vingroup'],
  BR: ['Itaú Unibanco', 'Nubank', 'Embraer', 'Vale S.A.', 'Ambev'],
  PK: ['Systems Limited', 'Habib Bank Limited', 'Netsol Technologies', 'Engro Corporation', 'Careem Pakistan'],
};

const JOB_TITLES = {
  'Engineering & IT': ['Software Engineer', 'Backend Developer', 'Data Analyst', 'QA Engineer', 'Systems Engineer', 'DevOps Engineer'],
  'Business & Economics': ['Financial Analyst', 'Assistant Manager', 'Business Analyst', 'Audit Associate', 'Marketing Executive'],
  'Health Sciences': ['Registered Nurse', 'Research Assistant', 'Clinical Coordinator', 'Public Health Officer', 'Pharmacist'],
  'Arts & Design': ['Junior Architect', 'Design Associate', 'Policy Research Assistant', 'Programme Officer', 'Urban Planner'],
};

const SOP_LIBRARY = {
  'Engineering & IT': [
    'During my final year I led a four-person team building a fault-tolerant message broker for our university\'s student services platform. What began as a course project ended up handling 40,000 daily events across three campuses, and it taught me that the hard part of software is never the algorithm — it is the failure mode you did not think about at 2am. The Master of Software Engineering at Melbourne attracts me precisely because the capstone is not simulated; I want to be accountable to a real partner with real users.',
    'I spent two years at a bank writing batch reconciliation jobs in a codebase older than I am. It was unglamorous work, but it made me obsessive about correctness and about the cost of systems nobody dares to change. I now want to move from maintaining systems to designing them, and Melbourne\'s emphasis on distributed architecture and secure-by-design practice is the exact gap in my training.',
    'My interest in data science started with a frustration: our hospital collected excellent patient intake data and used almost none of it. I built a small dashboard in my own time that reduced triage misallocation by a measurable margin, and I have wanted formal statistical training ever since. I am particularly drawn to the causal inference stream, because prediction without causation has already misled my organisation more than once.',
  ],
  'Business & Economics': [
    'Working as an analyst through a currency crisis taught me more about risk than any textbook could. I watched hedging decisions made on instinct rather than evidence, and I saw what that cost. I am applying to Melbourne because the programme\'s alignment with the CFA curriculum, combined with the live portfolio unit, gives me the rare combination of theoretical rigour and accountable practice that I need to move into a portfolio management role.',
    'I am the first person in my family to complete a university degree, and I ran a small import business alongside my studies to fund it. That business failed, instructively. I learned that I understood my customers and misunderstood my working capital entirely. I want formal training in corporate finance so that the next venture I build fails for more interesting reasons.',
    'After three years leading a five-person team, I reached the limit of what intuition alone could deliver. My decisions were defensible but not systematic. The Melbourne MBA appeals to me because of the international consulting project — I want to be dropped into an unfamiliar market with an unfamiliar problem, because that is precisely the situation my current role has stopped providing.',
  ],
  'Health Sciences': [
    'I worked for two years in a district hospital where we recorded maternal outcomes on paper and reviewed them annually, if at all. The gap between the data we held and the decisions we made was the single largest preventable factor in our outcomes. I want to study epidemiology and health economics at Melbourne so that I can return to that system as someone who can build the evidence pipeline it currently lacks.',
    'Nursing was not my first degree. I studied biology, worked in a laboratory, and found the distance from patients unbearable. The graduate-entry pathway at Melbourne is the reason I am applying — it recognises my scientific foundation while giving me the 840 supervised clinical hours I need to practise. I intend to register in Victoria and work in regional acute care, where the shortage is most acute.',
    'My grandmother\'s diabetes was managed by a community health worker with three weeks of training and no diagnostic equipment. She did remarkable work with almost nothing. That contrast has driven every academic decision I have made since. I want to study public health at a university with genuine global health infrastructure so that I can contribute to designing systems, not just working around their absence.',
  ],
  'Arts & Design': [
    'My undergraduate thesis examined informal housing settlements in my city — 400,000 people building sophisticated, adaptive architecture with no architect involved. It made me sceptical of a discipline that mostly ignores them. I am applying to the Melbourne School of Design because the vertical studio model puts me alongside practitioners who take questions of density and informality seriously rather than treating them as someone else\'s problem.',
    'I have spent three years working in the policy unit of a regional NGO, mostly writing briefs that nobody in the ministry read. I have come to believe that this is a problem of craft as much as of politics. The Master of International Relations at Melbourne, and specifically its Indo-Pacific specialisation, would let me build the regional expertise and analytical discipline that separates a brief which changes a decision from one that does not.',
    'Architecture in my country is largely the business of replicating imported forms in a climate that punishes them. I want to work on the opposite problem: buildings that are specific to where they stand. Melbourne\'s environmental design research and its studio culture are the reason I am applying, and I intend to return home to practise rather than to stay.',
  ],
};

const REFERENCE_EXCERPTS = [
  'I have supervised this student for two years and would place them comfortably in the top 5% of the cohort I have taught in the last decade. Their analytical work is careful, and unusually for a student at this level, they are willing to say when they do not know something.',
  'They joined my team as the most junior member and within a year were leading the technical direction of a project touching three departments. Their written communication is exceptionally clear, which in my experience is the rarest quality in technically strong candidates.',
  'This candidate stood out not for raw marks — which are strong — but for intellectual persistence. They spent an entire semester on a problem that most students would have abandoned, and produced the most original piece of undergraduate work I supervised that year.',
  'I recommend this applicant without reservation. Their capacity for independent research is well beyond what I would expect at this stage, and they handled a significant setback in their fieldwork with real professional maturity.',
  'As their direct manager I can attest to consistent, high-quality delivery under genuine pressure. They are also the person other team members go to when they are stuck, which tells you more than any performance review would.',
  'Their honours thesis was examined at distinction level and is currently being prepared for publication. I have encouraged them to pursue graduate study for some time and am pleased to see them doing so at an institution of Melbourne\'s standing.',
];

const REF_TITLES = ['Professor', 'Associate Professor', 'Dr', 'Senior Manager', 'Head of Department', 'Principal Engineer'];
const REF_NAMES = ['R. Venkatesan', 'S. Ahmed', 'A. Okoro', 'T. Nguyen', 'J. Almeida', 'K. Mahmood', 'L. Fernandes', 'M. Hossain', 'P. Adeleke', 'D. Tran', 'N. Kapoor', 'F. Zaidi'];

const DOC_TYPES = [
  { type: 'passport', name: 'Passport (bio page)', required: true },
  { type: 'transcript', name: 'Academic Transcript', required: true },
  { type: 'degree', name: 'Degree Certificate', required: true },
  { type: 'english', name: 'English Test Report', required: true },
  { type: 'sop', name: 'Statement of Purpose', required: true },
  { type: 'reference', name: 'Reference Letter 1', required: true },
  { type: 'reference', name: 'Reference Letter 2', required: true },
  { type: 'cv', name: 'Curriculum Vitae', required: false },
  { type: 'financial', name: 'Financial Capacity Statement', required: false },
  { type: 'work', name: 'Work Experience Letter', required: false },
];

// Stage distribution across the 60 applicants — deliberately funnel-shaped.
const STAGE_PLAN = [
  ...Array(9).fill('new'),
  ...Array(11).fill('under_review'),
  ...Array(5).fill('shortlisted'),
  ...Array(5).fill('documents_requested'),
  ...Array(4).fill('interview'),
  ...Array(6).fill('offer_conditional'),
  ...Array(4).fill('offer_unconditional'),
  ...Array(4).fill('accepted'),
  ...Array(4).fill('deposit_paid'),
  ...Array(3).fill('waitlisted'),
  ...Array(2).fill('deferred'),
  ...Array(3).fill('rejected'),
];

function makeEnglishTest(strength) {
  const type = pick(['IELTS', 'IELTS', 'IELTS', 'TOEFL', 'PTE', 'Duolingo']);
  const jitter = () => (rand() - 0.5) * 1.0;
  if (type === 'IELTS') {
    const base = 5.5 + strength * 2.5;
    const band = () => Math.max(5, Math.min(9, Math.round((base + jitter()) * 2) / 2));
    const bands = { listening: band(), reading: band(), writing: band(), speaking: band() };
    const overall =
      Math.round(((bands.listening + bands.reading + bands.writing + bands.speaking) / 4) * 2) / 2;
    return { type, overall, bands, testDate: daysAgo(rint(40, 400)), reportNumber: `IELTS-${rint(100000, 999999)}` };
  }
  if (type === 'TOEFL') {
    const base = 68 + strength * 42;
    const sec = () => Math.max(12, Math.min(30, Math.round(base / 4 + jitter() * 4)));
    const bands = { listening: sec(), reading: sec(), writing: sec(), speaking: sec() };
    const overall = bands.listening + bands.reading + bands.writing + bands.speaking;
    return { type, overall, bands, testDate: daysAgo(rint(40, 400)), reportNumber: `TOEFL-${rint(100000, 999999)}` };
  }
  if (type === 'PTE') {
    const base = 50 + strength * 34;
    const sec = () => Math.max(36, Math.min(90, Math.round(base + jitter() * 6)));
    const bands = { listening: sec(), reading: sec(), writing: sec(), speaking: sec() };
    const overall = Math.round((bands.listening + bands.reading + bands.writing + bands.speaking) / 4);
    return { type, overall, bands, testDate: daysAgo(rint(40, 400)), reportNumber: `PTE-${rint(100000, 999999)}` };
  }
  const base = 95 + strength * 45;
  const sec = () => Math.max(70, Math.min(160, Math.round(base + jitter() * 10)));
  const bands = { literacy: sec(), comprehension: sec(), conversation: sec(), production: sec() };
  const overall = Math.round(base + jitter() * 5);
  return { type, overall, bands, testDate: daysAgo(rint(40, 400)), reportNumber: `DET-${rint(100000, 999999)}` };
}

function makeApplicant(index, country, nameTuple, stage) {
  const [firstName, lastName, gender] = nameTuple;
  const name = `${firstName} ${lastName}`;
  // Strength drives GPA + English together so profiles read coherently.
  const strength = Math.max(0, Math.min(1, rand() * 0.85 + (stage === 'rejected' ? -0.35 : 0) + (['accepted', 'deposit_paid', 'offer_unconditional'].includes(stage) ? 0.18 : 0)));
  const course = pick(COURSES.filter((c) => c.active));
  const openIntakes = course.intakes.filter((i) => new Date(i.closeDate).getTime() > NOW);
  const intake = openIntakes.length ? pick(openIntakes) : course.intakes[0];

  const gpa4 = round(2.35 + strength * 1.6, 2);
  const gsys = GPA_SYSTEMS[country];
  const isBachelor = course.level === 'Bachelor';
  const age = isBachelor ? rint(17, 21) : rint(21, 32);
  const workYears = isBachelor ? 0 : rand() < 0.35 ? 0 : round(rand() * 6, 1);
  const priorDegree = isBachelor ? SECONDARY_QUALS[country] : pick(PRIOR_DEGREES[course.faculty]);
  const institution = pick(INSTITUTIONS[country]);
  const english = makeEnglishTest(strength);

  const appliedDaysAgo = rint(2, 120);
  const stageMeta = stageById(stage);
  // Later stages have been sitting for a plausible amount of time.
  const daysInStage = stage === 'new' ? rint(1, 14) : rint(1, 22);

  const workHistory =
    workYears > 0
      ? [
          {
            id: uid('job'),
            title: pick(JOB_TITLES[course.faculty]),
            employer: pick(EMPLOYERS[country]),
            years: workYears,
            from: daysAgo(Math.round(workYears * 365) + 30),
            to: chance(0.6) ? 'Present' : daysAgo(rint(30, 200)),
            summary: 'Delivered production work in a team environment with direct responsibility for scoped outcomes.',
          },
        ]
      : [];

  const refs = [0, 1].map((n) => ({
    id: uid('ref'),
    name: `${pick(REF_TITLES)} ${pick(REF_NAMES)}`,
    title: n === 0 ? 'Academic Referee' : workYears > 0 ? 'Professional Referee' : 'Academic Referee',
    institution: n === 0 ? institution : workYears > 0 ? pick(EMPLOYERS[country]) : institution,
    relationship: n === 0 ? 'Thesis supervisor' : workYears > 0 ? 'Direct line manager' : 'Course coordinator',
    excerpt: pick(REFERENCE_EXCERPTS),
    submittedDate: daysAgo(appliedDaysAgo - rint(0, 2)),
    verified: chance(0.85),
  }));

  const documents = DOC_TYPES.filter((d) => d.required || chance(0.55) || (d.type === 'work' && workYears > 0)).map((d) => {
    let status = 'pending';
    const order = stageMeta.order;
    if (order >= 6) status = chance(0.92) ? 'approved' : 'pending';
    else if (order >= 3) status = chance(0.6) ? 'approved' : chance(0.5) ? 'pending' : 'rejected';
    else status = chance(0.25) ? 'approved' : 'pending';
    if (stage === 'documents_requested' && d.type === 'transcript') status = 'rejected';
    const rejected = status === 'rejected';
    return {
      id: uid('doc'),
      name: d.name,
      type: d.type,
      fileName: `${lastName.toLowerCase().replace(/\s+/g, '-')}-${d.type}.pdf`,
      sizeKb: rint(180, 4200),
      uploadedDate: daysAgo(appliedDaysAgo - rint(0, 3)),
      status,
      required: d.required,
      rejectionReason: rejected ? pick(DOC_REJECTION_REASONS) : null,
      replacementRequested: rejected && chance(0.7),
      reviewedBy: status === 'pending' ? null : pick(REVIEWERS).name,
      reviewedAt: status === 'pending' ? null : daysAgo(rint(1, appliedDaysAgo)),
    };
  });

  const reviewer = stage === 'new' && chance(0.55) ? null : pick(REVIEWERS).id;

  const noteBank = [
    'Strong technical profile but transcript grading scale needs verification with the institution.',
    'Agent has confirmed the applicant can meet the financial capacity requirement. Bank statement to follow.',
    'Spoke with the applicant by phone — clear motivation, good English in conversation, matches the written SOP.',
    'Flagging that the English test expires within six months of course commencement. Confirm before offer.',
    'Referee 2 has not responded to verification email after two attempts. Chasing again this week.',
    'Would be a good candidate for the South Asia Merit Award if GPA holds after final transcript.',
    'Applicant has applied to two other Go8 institutions per the agent. Likely to need a fast turnaround.',
  ];
  const notes =
    stageMeta.order >= 2 && chance(0.75)
      ? Array.from({ length: rint(1, 3) }, () => {
          const author = pick(REVIEWERS);
          return {
            id: uid('note'),
            author: author.name,
            authorId: author.id,
            role: author.role,
            text: pick(noteBank),
            createdAt: daysAgo(rint(1, Math.max(2, appliedDaysAgo - 1))),
          };
        }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      : [];

  // Timeline reconstructed from the path the application took to reach `stage`.
  const timeline = [
    {
      id: uid('ev'),
      type: 'submitted',
      actor: name,
      actorType: 'student',
      text: `Application submitted via StudyFound for ${course.title}`,
      at: daysAgo(appliedDaysAgo),
    },
    {
      id: uid('ev'),
      type: 'documents',
      actor: name,
      actorType: 'student',
      text: `${documents.length} documents uploaded`,
      at: daysAgo(appliedDaysAgo - 1 > 0 ? appliedDaysAgo - 1 : appliedDaysAgo),
    },
  ];
  if (reviewer) {
    timeline.push({
      id: uid('ev'),
      type: 'assignment',
      actor: 'System',
      actorType: 'system',
      text: `Assigned to ${REVIEWERS.find((r) => r.id === reviewer).name}`,
      at: daysAgo(Math.max(1, appliedDaysAgo - 2)),
    });
  }
  const PATH = {
    new: [],
    under_review: ['under_review'],
    shortlisted: ['under_review', 'shortlisted'],
    documents_requested: ['under_review', 'documents_requested'],
    interview: ['under_review', 'shortlisted', 'interview'],
    offer_conditional: ['under_review', 'shortlisted', 'offer_conditional'],
    offer_unconditional: ['under_review', 'shortlisted', 'offer_unconditional'],
    accepted: ['under_review', 'shortlisted', 'offer_unconditional', 'accepted'],
    deposit_paid: ['under_review', 'shortlisted', 'offer_unconditional', 'accepted', 'deposit_paid'],
    waitlisted: ['under_review', 'waitlisted'],
    deferred: ['under_review', 'offer_unconditional', 'deferred'],
    rejected: ['under_review', 'rejected'],
  }[stage];
  const path = PATH || [];
  path.forEach((s, i) => {
    const at = daysAgo(Math.max(1, appliedDaysAgo - 3 - i * Math.max(1, Math.floor((appliedDaysAgo - daysInStage) / (path.length + 1)))));
    timeline.push({
      id: uid('ev'),
      type: 'stage',
      stage: s,
      actor: reviewer ? REVIEWERS.find((r) => r.id === reviewer).name : 'Sarah Chen',
      actorType: 'staff',
      text: `Stage changed to ${stageById(s).label}`,
      at: i === path.length - 1 ? daysAgo(daysInStage) : at,
    });
  });
  timeline.sort((a, b) => new Date(a.at) - new Date(b.at));

  return {
    id: `app_${String(index + 1).padStart(3, '0')}`,
    reference: `SF-${2026}-${String(4100 + index).padStart(5, '0')}`,
    firstName,
    lastName,
    name,
    gender,
    photo: null, // rendered as a deterministic initials avatar
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@email.com`,
    phone: `${DIAL_CODES[country]} ${rint(600, 999)} ${rint(100000, 999999)}`,
    nationality: COUNTRIES.find((c) => c.code === country).name,
    countryCode: country,
    age,
    dateOfBirth: new Date(NOW - age * 365.25 * DAY - rint(0, 300) * DAY).toISOString(),
    city: pick({
      IN: ['Bengaluru', 'Chennai', 'Pune', 'Hyderabad', 'New Delhi', 'Kochi'],
      BD: ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi'],
      NG: ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt'],
      VN: ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Can Tho'],
      BR: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba'],
      PK: ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad'],
    }[country]),
    degreeSought: course.level,
    courseId: course.id,
    intakeId: intake.id,
    gpa: {
      value: gpa4,
      scale: 4,
      original: { value: gsys.convert(gpa4), scale: gsys.scale, system: gsys.system },
      institution,
      graduationYear: isBachelor ? 2026 : 2026 - rint(0, 4),
    },
    englishTest: english,
    priorDegree,
    workExperienceYears: workYears,
    workHistory,
    sop: pick(SOP_LIBRARY[course.faculty]),
    references: refs,
    documents,
    applicationDate: daysAgo(appliedDaysAgo),
    stage,
    stageChangedAt: daysAgo(daysInStage),
    assignedReviewer: reviewer,
    notes,
    timeline,
    offerConditions: stage === 'offer_conditional'
      ? 'Provision of the final academic transcript showing an overall GPA no lower than the interim result, and evidence of completion of the bachelor degree by 31 January 2027.'
      : null,
    scholarshipAwards: [],
    agent: chance(0.55) ? pick(['StudyFound Direct', 'IDP Education', 'AECC Global', 'Edwise International', 'Global Reach']) : 'StudyFound Direct',
    interviewDate: stage === 'interview' ? daysAhead(rint(2, 18)) : null,
  };
}

function buildApplicants() {
  const entries = [];
  Object.entries(NAME_POOL).forEach(([code, names]) => {
    names.forEach((n) => entries.push({ code, name: n }));
  });
  // Deterministic shuffle so nationalities are spread through the stage plan.
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return entries.map((e, i) => makeApplicant(i, e.code, e.name, STAGE_PLAN[i] || 'new'));
}

export const APPLICANTS = buildApplicants();

// ---------------------------------------------------------------------------
// Scholarships
// ---------------------------------------------------------------------------
export const SCHOLARSHIPS = [
  {
    id: 'sch_1',
    name: 'Global Excellence Scholarship',
    type: 'percentage',
    value: 25,
    currency: 'AUD',
    slotsTotal: 20,
    budgetCap: 240000,
    budgetUsed: 0,
    deadline: daysAhead(68),
    active: true,
    description:
      'Awarded to the highest-achieving international applicants across all faculties. Applied as a 25% reduction on tuition for the full duration of the course.',
    criteria: {
      minGpa: 3.6,
      countries: [],
      courseIds: [],
      needBased: false,
      minEnglishIelts: 7.0,
      levels: [],
    },
    awards: [],
  },
  {
    id: 'sch_2',
    name: 'South Asia Merit Award',
    type: 'fixed',
    value: 8000,
    currency: 'AUD',
    slotsTotal: 12,
    budgetCap: 96000,
    budgetUsed: 0,
    deadline: daysAhead(41),
    active: true,
    description:
      'A one-off tuition credit for strong applicants from South Asia, applied against the first year of study.',
    criteria: {
      minGpa: 3.3,
      countries: ['IN', 'BD', 'PK'],
      courseIds: [],
      needBased: false,
      minEnglishIelts: 6.5,
      levels: [],
    },
    awards: [],
  },
  {
    id: 'sch_3',
    name: 'Women in STEM Scholarship',
    type: 'percentage',
    value: 50,
    currency: 'AUD',
    slotsTotal: 8,
    budgetCap: 200000,
    budgetUsed: 0,
    deadline: daysAhead(23),
    active: true,
    description:
      'Half-tuition scholarship supporting women entering engineering, technology and health science programmes. Includes a faculty mentor for the duration of the degree.',
    criteria: {
      minGpa: 3.4,
      countries: [],
      courseIds: [],
      faculties: ['Engineering & IT', 'Health Sciences'],
      gender: 'f',
      needBased: false,
      minEnglishIelts: 6.5,
      levels: [],
    },
    awards: [],
  },
  {
    id: 'sch_4',
    name: 'Regional Access Grant',
    type: 'fixed',
    value: 5000,
    currency: 'AUD',
    slotsTotal: 25,
    budgetCap: 125000,
    budgetUsed: 0,
    deadline: daysAhead(96),
    active: true,
    description:
      'Need-based grant reducing the up-front cost of study for applicants from under-represented sending markets. Assessed alongside the financial capacity statement.',
    criteria: {
      minGpa: 3.0,
      countries: ['NG', 'VN', 'BR'],
      courseIds: [],
      needBased: true,
      minEnglishIelts: 6.0,
      levels: [],
    },
    awards: [],
  },
];

// Pre-consume some slots so the schemes read as partially used.
(function seedAwards() {
  const eligiblePool = APPLICANTS.filter((a) => stageById(a.stage).order >= 6);
  const plan = [
    ['sch_1', 7],
    ['sch_2', 5],
    ['sch_3', 3],
    ['sch_4', 9],
  ];
  plan.forEach(([schemeId, count]) => {
    const scheme = SCHOLARSHIPS.find((s) => s.id === schemeId);
    const candidates = eligiblePool.filter((a) => {
      if (scheme.criteria.countries.length && !scheme.criteria.countries.includes(a.countryCode)) return false;
      if (scheme.criteria.gender && a.gender !== scheme.criteria.gender) return false;
      return a.gpa.value >= scheme.criteria.minGpa - 0.35;
    });
    candidates.slice(0, count).forEach((a) => {
      const course = COURSES.find((c) => c.id === a.courseId);
      const amount = scheme.type === 'percentage' ? Math.round((course.tuition * scheme.value) / 100) : scheme.value;
      scheme.awards.push({
        id: uid('award'),
        applicantId: a.id,
        applicantName: a.name,
        amount,
        awardedBy: pick(REVIEWERS).name,
        awardedAt: daysAgo(rint(3, 60)),
        status: 'awarded',
      });
      scheme.budgetUsed += amount;
      a.scholarshipAwards.push({ schemeId: scheme.id, schemeName: scheme.name, amount });
    });
  });
})();

// ---------------------------------------------------------------------------
// Communication templates
// ---------------------------------------------------------------------------
export const MERGE_FIELDS = [
  { token: '{{student_name}}', label: 'Student full name' },
  { token: '{{first_name}}', label: 'Student first name' },
  { token: '{{course}}', label: 'Course title' },
  { token: '{{intake}}', label: 'Intake' },
  { token: '{{university}}', label: 'University name' },
  { token: '{{reference}}', label: 'Application reference' },
  { token: '{{deadline}}', label: 'Response deadline' },
  { token: '{{tuition}}', label: 'Annual tuition' },
  { token: '{{conditions}}', label: 'Offer conditions' },
  { token: '{{officer_name}}', label: 'Admissions officer name' },
  { token: '{{scholarship_name}}', label: 'Scholarship name' },
  { token: '{{scholarship_amount}}', label: 'Scholarship amount' },
];

export const TEMPLATES = [
  {
    id: 'tpl_offer',
    name: 'Unconditional Offer Letter',
    category: 'Offer',
    subject: 'Offer of Admission — {{course}}, {{intake}}',
    body: `Dear {{first_name}},

I am delighted to inform you that your application to {{university}} has been successful. You have been offered a place in the {{course}} commencing {{intake}}.

Application reference: {{reference}}
Annual tuition: {{tuition}}

This offer is unconditional. To accept, please confirm through your StudyFound account by {{deadline}}. Your place cannot be held beyond that date.

Once you accept, our international student team will contact you regarding your Confirmation of Enrolment (CoE), visa documentation and arrival support.

Congratulations on this achievement. We look forward to welcoming you to Melbourne.

Kind regards,
{{officer_name}}
Admissions Office, {{university}}`,
  },
  {
    id: 'tpl_conditional',
    name: 'Conditional Offer Letter',
    category: 'Offer',
    subject: 'Conditional Offer of Admission — {{course}}, {{intake}}',
    body: `Dear {{first_name}},

Thank you for your application to {{university}}. I am pleased to offer you a conditional place in the {{course}} commencing {{intake}}.

Application reference: {{reference}}
Annual tuition: {{tuition}}

This offer is subject to the following conditions:

{{conditions}}

Please provide the evidence required above by {{deadline}}. Once received and verified, we will issue an unconditional offer.

If you have any questions about meeting these conditions, reply to this email and we will assist.

Kind regards,
{{officer_name}}
Admissions Office, {{university}}`,
  },
  {
    id: 'tpl_docs',
    name: 'Document Request',
    category: 'Documents',
    subject: 'Action required: documents needed for application {{reference}}',
    body: `Dear {{first_name}},

We have begun assessing your application for the {{course}} ({{intake}}) but cannot proceed without additional documentation.

Please upload the following to your StudyFound account by {{deadline}}:

— A certified copy of your full academic transcript
— A clear scan of your passport biographical page

Documents must be legible, complete and officially certified. Where the original is not in English, an official translation is required alongside the original.

Your application will remain on hold until these are received.

Kind regards,
{{officer_name}}
Admissions Office, {{university}}`,
  },
  {
    id: 'tpl_interview',
    name: 'Interview Invitation',
    category: 'Assessment',
    subject: 'Interview invitation — {{course}} application {{reference}}',
    body: `Dear {{first_name}},

Your application for the {{course}} ({{intake}}) has progressed to interview.

The interview runs for approximately 30 minutes by video call and covers your academic background, your motivation for the programme, and your intended direction after graduation. There is no test component.

Please select a time from the scheduling link in your StudyFound account before {{deadline}}.

We look forward to speaking with you.

Kind regards,
{{officer_name}}
Admissions Office, {{university}}`,
  },
  {
    id: 'tpl_reject',
    name: 'Application Outcome — Unsuccessful',
    category: 'Decision',
    subject: 'Outcome of your application to {{university}}',
    body: `Dear {{first_name}},

Thank you for applying to the {{course}} at {{university}} for {{intake}}.

After careful assessment, we are unable to offer you a place on this occasion. Applications for this programme substantially exceeded the places available, and decisions were made on overall academic and English-language performance against a competitive field.

This outcome does not prevent you from applying for a future intake, and you are welcome to apply again should your circumstances change.

We wish you well with your studies.

Kind regards,
{{officer_name}}
Admissions Office, {{university}}`,
  },
  {
    id: 'tpl_scholarship',
    name: 'Scholarship Award Notification',
    category: 'Scholarship',
    subject: 'You have been awarded the {{scholarship_name}}',
    body: `Dear {{first_name}},

Congratulations. Following assessment of your application for the {{course}} ({{intake}}), you have been awarded the {{scholarship_name}}, valued at {{scholarship_amount}}.

Application reference: {{reference}}

The award is applied directly against your tuition invoice — no separate claim is required. It is conditional on you accepting your offer and enrolling in the {{intake}} intake.

This scholarship is competitive and awarded to a small number of applicants each intake. It reflects the strength of your academic record.

Kind regards,
{{officer_name}}
Admissions Office, {{university}}`,
  },
];

export const SAVED_VIEWS = [
  {
    id: 'view_1',
    name: 'My queue — needs action',
    system: true,
    filters: { stage: ['new', 'under_review'], reviewer: ['u_sarah'], course: [], intake: [], country: [], eligibility: [], search: '' },
  },
  {
    id: 'view_2',
    name: 'Offers awaiting response',
    system: true,
    filters: { stage: ['offer_conditional', 'offer_unconditional'], reviewer: [], course: [], intake: [], country: [], eligibility: [], search: '' },
  },
  {
    id: 'view_3',
    name: 'Borderline — needs a second look',
    system: true,
    filters: { stage: [], reviewer: [], course: [], intake: [], country: [], eligibility: ['borderline'], search: '' },
  },
];

export const SENT_MESSAGES = [
  {
    id: 'msg_1',
    templateId: 'tpl_offer',
    templateName: 'Unconditional Offer Letter',
    subject: 'Offer of Admission — Master of Data Science, Semester 1 2027',
    recipients: [{ id: APPLICANTS[12].id, name: APPLICANTS[12].name, email: APPLICANTS[12].email }],
    sentBy: 'Sarah Chen',
    sentAt: daysAgo(3),
    status: 'sent',
  },
  {
    id: 'msg_2',
    templateId: 'tpl_docs',
    templateName: 'Document Request',
    subject: 'Action required: documents needed for your application',
    recipients: APPLICANTS.slice(20, 26).map((a) => ({ id: a.id, name: a.name, email: a.email })),
    sentBy: 'Marcus Webb',
    sentAt: daysAgo(6),
    status: 'sent',
  },
  {
    id: 'msg_3',
    templateId: 'tpl_interview',
    templateName: 'Interview Invitation',
    subject: 'Interview invitation — Master of Business Administration',
    recipients: APPLICANTS.slice(30, 33).map((a) => ({ id: a.id, name: a.name, email: a.email })),
    sentBy: 'Priya Raghavan',
    sentAt: daysAgo(11),
    status: 'sent',
  },
];

export function buildInitialState() {
  return {
    version: 3,
    university: UNIVERSITY,
    courses: COURSES,
    applicants: APPLICANTS,
    scholarships: SCHOLARSHIPS,
    templates: TEMPLATES,
    savedViews: SAVED_VIEWS,
    messages: SENT_MESSAGES,
    reviewers: REVIEWERS,
  };
}
