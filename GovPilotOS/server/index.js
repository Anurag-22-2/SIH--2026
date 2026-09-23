const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const proposalRoutes = require('./routes/proposals');
const evaluationRoutes = require('./routes/evaluations');
const pilotRoutes = require('./routes/pilots');
const kpiRoutes = require('./routes/kpis');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const secureRoutes = require('./routes/secure');
const riskRoutes = require('./routes/risks');
const { rateLimiter } = require('./middleware/security');
const { ProposalService } = require('./services/proposal.service');
const { ScreeningService } = require('./services/screening.service');

const db = require('./db/store');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const VALID_ROLES = ['government', 'startup', 'expert', 'admin'];

const FALLBACK_USERS = [
  {
    id: 'gov-user',
    email: 'officer@govpilot.gov',
    full_name: 'Sarah Chen',
    role: 'government',
    organization: 'Ministry of Digital Affairs',
    bio: 'Senior policy officer focused on innovation and digital transformation',
  },
  {
    id: 'startup-user',
    email: 'startup@staqu.com',
    full_name: 'Vikas Madaan',
    role: 'startup',
    organization: 'Staqu Technologies',
    bio: 'AI-driven video intelligence and public safety technology company.',
  },
  {
    id: 'expert-user',
    email: 'expert@university.edu',
    full_name: 'Dr. Michael Torres',
    role: 'expert',
    organization: 'State University',
    bio: 'Professor of Public Administration and Innovation',
  },
  {
    id: 'admin-user',
    email: 'admin@govpilot.gov',
    full_name: 'James Wilson',
    role: 'admin',
    organization: 'GovPilot Platform',
    bio: 'Platform administrator',
  },
];

const STARTUP_SEED = [
  {
    id: 'ST-001',
    name: 'Staqu Technologies',
    legalName: 'Staqu Technologies Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP14592',
    gfrExemptionEligible: true,
    sector: 'Defense & Security',
    trlLevel: 9,
    foundedYear: 2015,
    headquarters: 'Gurugram, Haryana',
    teamSize: 85,
    techStack: ['Computer Vision', 'Facial Recognition', 'Python', 'TensorFlow', 'Edge AI'],
    summary: 'AI video analytics and facial recognition platform turning standard CCTV feeds into active security and criminal tracking intelligence.',
    patents: 4,
    financials: {
      revenueStage: 'Growth',
      lastYearTurnover: '₹15.2 Cr',
      profitability: 'Profitable',
    },
    gemRegistered: true,
    pastGovtProjects: [{
      department: 'Uttar Pradesh Police',
      projectName: 'Trinetra AI Criminal Database',
      status: 'Deployed & Scaled',
      kpiAchieved: 'Digitized 5 Lakh+ records; 99.9% recognition accuracy',
      year: 2019,
    }],
  },
  {
    id: 'ST-002',
    name: 'Niramai',
    legalName: 'Niramai Health Analytix Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP22451',
    gfrExemptionEligible: true,
    sector: 'HealthTech',
    trlLevel: 8,
    foundedYear: 2016,
    headquarters: 'Bengaluru, Karnataka',
    teamSize: 120,
    techStack: ['Thermal Imaging', 'Machine Learning', 'Cloud Analytics', 'React'],
    summary: 'Non-invasive, radiation-free, and privacy-aware breast cancer screening using AI-based thermal imaging (Thermalytix).',
    patents: 29,
    financials: {
      revenueStage: 'Scaling',
      lastYearTurnover: '₹8.5 Cr',
      profitability: 'Pre-Profit',
    },
    gemRegistered: true,
    pastGovtProjects: [{
      department: 'Govt of Karnataka Health Dept',
      projectName: 'Rural Mobile Screening Camps',
      status: 'Completed Pilot',
      kpiAchieved: 'Screened 100,000+ women with reduced false positives',
      year: 2022,
    }],
  },
  {
    id: 'ST-003',
    name: 'Detect Technologies',
    legalName: 'Detect Technologies Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP10293',
    gfrExemptionEligible: true,
    sector: 'Industrial Automation & AI',
    trlLevel: 9,
    foundedYear: 2016,
    headquarters: 'Chennai, Tamil Nadu',
    teamSize: 350,
    techStack: ['IoT', 'Drone Data Analytics', 'Computer Vision', 'Rust'],
    summary: 'AI-powered digital solutions for process industries, automating safety monitoring and pipeline leak detection via drone surveillance.',
    patents: 12,
    financials: {
      revenueStage: 'Series B Growth',
      lastYearTurnover: '₹65.0 Cr',
      profitability: 'Pre-Profit',
    },
    gemRegistered: true,
    pastGovtProjects: [{
      department: 'Oil India Limited (OIL)',
      projectName: 'Autonomous Pipeline Drone Surveillance',
      status: 'Scaled',
      kpiAchieved: '24/7 autonomous monitoring of crude flowlines',
      year: 2021,
    }],
  },
  {
    id: 'ST-004',
    name: 'Haqdarshak',
    legalName: 'Haqdarshak Empowerment Solutions',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP38291',
    gfrExemptionEligible: true,
    sector: 'CivicTech & Welfare',
    trlLevel: 9,
    foundedYear: 2016,
    headquarters: 'Pune, Maharashtra',
    teamSize: 400,
    techStack: ['React Native', 'Node.js', 'PostgreSQL', 'NLP'],
    summary: 'Tech platform enabling citizens to discover and apply for eligible government and private welfare schemes.',
    patents: 0,
    financials: {
      revenueStage: 'Growth',
      lastYearTurnover: '₹32.4 Cr',
      profitability: 'Profitable',
    },
    gemRegistered: false,
    pastGovtProjects: [{
      department: 'Various State Welfare Departments',
      projectName: 'COVID-19 Relief Entitlement Mapping',
      status: 'Completed',
      kpiAchieved: 'Facilitated over 62,000 applications across 20 states',
      year: 2020,
    }],
  },
  {
    id: 'ST-005',
    name: 'IdeaForge',
    legalName: 'IdeaForge Technology Ltd',
    dpiitRecognized: false,
    dpiitNumber: 'N/A',
    gfrExemptionEligible: false,
    sector: 'Aerospace & Drones',
    trlLevel: 9,
    foundedYear: 2007,
    headquarters: 'Navi Mumbai, Maharashtra',
    teamSize: 500,
    techStack: ['Embedded C', 'Telemetry', 'Computer Vision', 'C++'],
    summary: "India's largest manufacturer of drones for defense, homeland security, and industrial applications.",
    patents: 31,
    financials: {
      revenueStage: 'Publicly Listed',
      lastYearTurnover: '₹186.0 Cr',
      profitability: 'Profitable',
    },
    gemRegistered: true,
    pastGovtProjects: [{
      department: 'Survey of India',
      projectName: 'SVAMITVA Scheme Mapping',
      status: 'Scaled',
      kpiAchieved: 'Mapped thousands of villages for rural land records',
      year: 2021,
    }],
  },
  {
    id: 'ST-006',
    name: 'CropIn',
    legalName: 'CropIn Technology Solutions Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP09321',
    gfrExemptionEligible: true,
    sector: 'AgriTech',
    trlLevel: 9,
    foundedYear: 2010,
    headquarters: 'Bengaluru, Karnataka',
    teamSize: 250,
    techStack: ['Predictive AI', 'Geospatial Data', 'AWS', 'Python'],
    summary: 'Agri-intelligence platform that digitizes farm management and provides predictive analytics for crop yields.',
    patents: 3,
    financials: {
      revenueStage: 'Series C',
      lastYearTurnover: '₹45.0 Cr',
      profitability: 'Pre-Profit',
    },
    gemRegistered: true,
    pastGovtProjects: [{
      department: 'Ministry of Agriculture',
      projectName: 'PMFBY Crop Yield Prediction',
      status: 'Deployed',
      kpiAchieved: 'Analyzed yield data for 5+ states accurately',
      year: 2019,
    }],
  },
  {
    id: 'ST-007',
    name: 'Recykal',
    legalName: 'Rapidue Technologies Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP49210',
    gfrExemptionEligible: true,
    sector: 'CleanTech & Waste Management',
    trlLevel: 8,
    foundedYear: 2016,
    headquarters: 'Hyderabad, Telangana',
    teamSize: 180,
    techStack: ['Blockchain', 'MERN Stack', 'IoT Tracking', 'Mobile Edge'],
    summary: 'B2B digital marketplace for waste management and circular economy, connecting municipalities, recyclers, and brands.',
    patents: 2,
    financials: {
      revenueStage: 'Growth',
      lastYearTurnover: '₹74.5 Cr',
      profitability: 'Pre-Profit',
    },
    gemRegistered: true,
    pastGovtProjects: [{
      department: 'Kedarnath Nagar Panchayat',
      projectName: 'Digital Waste Track & Trace',
      status: 'Completed Pilot',
      kpiAchieved: 'Digitized 100% of plastic waste collection in pilgrim areas',
      year: 2022,
    }],
  },
  {
    id: 'ST-008',
    name: 'Garuda Aerospace',
    legalName: 'Garuda Aerospace Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP38222',
    gfrExemptionEligible: true,
    sector: 'Aerospace & AgriTech',
    trlLevel: 9,
    foundedYear: 2015,
    headquarters: 'Chennai, Tamil Nadu',
    teamSize: 220,
    techStack: ['Robotics', 'Flight Control Systems', 'AI Edge Processing'],
    summary: 'Drone-As-A-Service (DaaS) startup building drones for agricultural spraying, defense, and disaster management.',
    patents: 7,
    financials: {
      revenueStage: 'Series A',
      lastYearTurnover: '₹47.0 Cr',
      profitability: 'Pre-Profit',
    },
    gemRegistered: true,
    pastGovtProjects: [{
      department: 'NDRF',
      projectName: 'Disaster Relief Drone Deployment',
      status: 'Deployed',
      kpiAchieved: 'Delivered emergency supplies and live mapping during floods',
      year: 2021,
    }],
  },
  {
    id: 'ST-009',
    name: 'Blue Sky Analytics',
    legalName: 'Blue Sky Analytics Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP50192',
    gfrExemptionEligible: true,
    sector: 'ClimateTech',
    trlLevel: 7,
    foundedYear: 2018,
    headquarters: 'New Delhi, Delhi',
    teamSize: 45,
    techStack: ['Geospatial AI', 'Satellite Data', 'Big Data', 'Python'],
    summary: 'Climate tech startup building an API-based catalog of environmental datasets for monitoring air quality, emissions, and fires.',
    patents: 1,
    financials: {
      revenueStage: 'Seed',
      lastYearTurnover: '₹4.2 Cr',
      profitability: 'Pre-Profit',
    },
    gemRegistered: false,
    pastGovtProjects: [{
      department: 'State Pollution Control Board',
      projectName: 'SpaceTime Farm Fire Tracking',
      status: 'Pilot Executed',
      kpiAchieved: 'Near real-time tracking of crop stubble burning incidents',
      year: 2021,
    }],
  },
  {
    id: 'ST-010',
    name: 'Log9 Materials',
    legalName: 'Log 9 Materials Scientific Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP11234',
    gfrExemptionEligible: true,
    sector: 'DeepTech & EV',
    trlLevel: 8,
    foundedYear: 2015,
    headquarters: 'Bengaluru, Karnataka',
    teamSize: 300,
    techStack: ['Graphene Synthesis', 'BMS Firmware', 'C', 'Data Analytics'],
    summary: 'Advanced battery technology startup manufacturing rapid-charging batteries for commercial EV fleets.',
    patents: 16,
    financials: {
      revenueStage: 'Series B',
      lastYearTurnover: '₹38.0 Cr',
      profitability: 'Pre-Profit',
    },
    gemRegistered: true,
    pastGovtProjects: [{
      department: 'Municipal Transport Authority',
      projectName: 'InstaCharge 3W EV Pilot',
      status: 'Active Pilot',
      kpiAchieved: 'Achieved 15-minute full charge on last-mile delivery fleet',
      year: 2023,
    }],
  },
  {
    id: 'ST-011',
    name: 'Qure.ai',
    legalName: 'Qure AI Technologies Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP30421',
    gfrExemptionEligible: true,
    sector: 'HealthTech',
    trlLevel: 9,
    foundedYear: 2016,
    headquarters: 'Mumbai, Maharashtra',
    teamSize: 280,
    techStack: ['Deep Learning', 'Medical Imaging', 'AWS', 'Python'],
    summary: 'Breakthrough AI for medical imaging that reads X-rays and CT scans to detect TB, Covid-19, and brain trauma.',
    patents: 11,
    financials: {
      revenueStage: 'Series C',
      lastYearTurnover: '₹95.0 Cr',
      profitability: 'Pre-Profit',
    },
    gemRegistered: true,
    pastGovtProjects: [{
      department: 'Brihanmumbai Municipal Corporation (BMC)',
      projectName: 'AI TB Screening in Slums',
      status: 'Scaled',
      kpiAchieved: 'Processed 50,000+ X-rays instantly, reducing diagnostic delay by 80%',
      year: 2020,
    }],
  },
  {
    id: 'ST-012',
    name: 'Agnikul Cosmos',
    legalName: 'Agnikul Cosmos Pvt Ltd',
    dpiitRecognized: true,
    dpiitNumber: 'DIPP29103',
    gfrExemptionEligible: true,
    sector: 'SpaceTech',
    trlLevel: 8,
    foundedYear: 2017,
    headquarters: 'Chennai, Tamil Nadu',
    teamSize: 150,
    techStack: ['3D Printing', 'Propulsion Engineering', 'Flight Dynamics', 'C++'],
    summary: 'Building highly customizable, 3D-printed launch vehicles capable of taking small satellites to Low Earth Orbit.',
    patents: 5,
    financials: {
      revenueStage: 'Pre-Revenue',
      lastYearTurnover: '₹0.5 Cr',
      profitability: 'Pre-Profit',
    },
    gemRegistered: false,
    pastGovtProjects: [{
      department: 'ISRO / IN-SPACe',
      projectName: 'Private Launchpad Integration',
      status: 'Active Validation',
      kpiAchieved: 'Successfully test-fired fully 3D printed semi-cryogenic engine',
      year: 2022,
    }],
  },
];

const CHALLENGE_SEED = [
  {
    id: 'CH-001',
    challenge_code: 'MSINS/PWD/2026/001',
    title: 'AI-Powered Citizen Request Triage',
    description: 'Deploy AI to classify and route civic service requests to the right department with traceable escalations.',
    problem_statement: 'Citizen service requests are manually triaged and often misrouted, causing delays in response and poor citizen experience.',
    desired_outcomes: 'Reduce routing time to under 1 hour and improve first-contact resolution.',
    success_criteria: '90% routing accuracy and less than 1 hour median response time.',
    sector: 'PWD',
    department: 'Citizen Services',
    district: 'Pune',
    budget_min: 6000000,
    budget_max: 18000000,
    duration_weeks: 12,
    status: 'open',
    priority: 'high',
    contact_person: 'Sarah Chen',
    tags: 'AI, NLP, civic service',
    outcome_targets: [],
    eligibility: { dpiit_required: true, min_trl: 6, maharashtra_presence_required: true, conditions: ['DPIIT registration required'] },
    evaluation_weights: { tech_novelty: 0.25, feasibility: 0.2, cost_efficiency: 0.15, scalability: 0.2, team_capability: 0.1, compliance: 0.1 },
    expert_panel: [],
    min_expert_evaluations: 2,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'CH-002',
    challenge_code: 'MSINS/WASTE/2026/014',
    title: 'Waste-to-Energy Monitoring Dashboard',
    description: 'Build a dashboard to monitor waste segregation, conversion performance, and treatment bottlenecks across city facilities.',
    problem_statement: 'Municipal waste operations are fragmented and lack real-time monitoring, which reduces diversion and efficiency.',
    desired_outcomes: 'Improve diversion rate and automate operations reporting.',
    success_criteria: 'Track 100% of facilities and generate automated monthly reports.',
    sector: 'Urban Waste',
    department: 'Urban Waste Management',
    district: 'Nashik',
    budget_min: 5000000,
    budget_max: 10000000,
    duration_weeks: 16,
    status: 'in_review',
    priority: 'medium',
    contact_person: 'Aditi Rao',
    tags: 'waste, sustainability, dashboard',
    outcome_targets: [],
    eligibility: { dpiit_required: true, min_trl: 5, maharashtra_presence_required: true, conditions: ['Experience in municipal analytics preferred'] },
    evaluation_weights: { tech_novelty: 0.2, feasibility: 0.25, cost_efficiency: 0.15, scalability: 0.2, team_capability: 0.1, compliance: 0.1 },
    expert_panel: [],
    min_expert_evaluations: 2,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'CH-003',
    challenge_code: 'MSINS/WATER/2026/021',
    title: 'Water Quality Alerting Network',
    description: 'Create a sensor-driven and AI-assisted water quality alerting network for rapid intervention at municipal facilities.',
    problem_statement: 'Water utilities lack a timely alerting mechanism for contamination anomalies and asset failures.',
    desired_outcomes: 'Reduce public health risk and improve compliance reporting.',
    success_criteria: '95% sensor uptime and 48-hour intervention turnaround.',
    sector: 'Water Quality',
    department: 'Water Resources',
    district: 'Aurangabad',
    budget_min: 9000000,
    budget_max: 22000000,
    duration_weeks: 20,
    status: 'open',
    priority: 'critical',
    contact_person: 'Rohit Kulkarni',
    tags: 'water, sensors, public health',
    outcome_targets: [],
    eligibility: { dpiit_required: true, min_trl: 6, maharashtra_presence_required: true, conditions: ['Strong sensor integration experience'] },
    evaluation_weights: { tech_novelty: 0.25, feasibility: 0.2, cost_efficiency: 0.15, scalability: 0.2, team_capability: 0.1, compliance: 0.1 },
    expert_panel: [],
    min_expert_evaluations: 2,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getSeedStartups() {
  return STARTUP_SEED.map((startup) => ({ ...startup }));
}

function getSeedChallenges() {
  return CHALLENGE_SEED.map((challenge) => ({ ...challenge }));
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

async function getUserForRole(role) {
  const targetRole = (role || '').toLowerCase();

  try {
    const users = await db.getAll('users');
    if (Array.isArray(users) && users.length > 0) {
      return users.find((user) => (user.role || '').toLowerCase() === targetRole) || users[0] || null;
    }
  } catch (err) {
    // fall through to static seed users below
  }

  return FALLBACK_USERS.find((user) => user.role === targetRole) || FALLBACK_USERS[0] || null;
}

async function getPortalPayload(role, user) {
  const fetchStartups = getSeedStartups();
  const fetchChallenges = getSeedChallenges();
  const [users, challenges, proposals, pilots, evaluations, kpis, snapshots, scaleDecisions, notifications, milestones, contracts, meetings] = await Promise.all([
   db.getAll('users'),
   db.getAll('challenges'),
   db.getAll('proposals'),
   db.getAll('pilots'),
   db.getAll('evaluations'),
   db.getAll('kpis'),
   db.getAll('kpi_snapshots'),
   db.getAll('scale_decisions'),
   db.getAll('notifications'),
   db.getAll('milestones'),
   db.getAll('contracts'),
   db.getAll('meetings'),
  ]);

  const seededChallenges = (challenges && challenges.length ? challenges : fetchChallenges);
  const seededProposals = proposals && proposals.length ? proposals : [];
  const seededPilots = pilots && pilots.length ? pilots : [];
  const seededEvaluations = evaluations && evaluations.length ? evaluations : [];
  const seededKpis = kpis && kpis.length ? kpis : [];
  const seededSnapshots = snapshots && snapshots.length ? snapshots : [];
  const seededScaleDecisions = scaleDecisions && scaleDecisions.length ? scaleDecisions : [];
  const seededNotifications = notifications && notifications.length ? notifications : [];
  const seededMilestones = milestones && milestones.length ? milestones : [];
  const seededContracts = contracts && contracts.length ? contracts : [];
  const seededMeetings = meetings && meetings.length ? meetings : [];

  if (role === 'startup') {
   const myProposals = seededProposals.filter((proposal) => proposal.startup_id === user.id);
   const myPilots = seededPilots.filter((pilot) => pilot.startup_id === user.id);
   const myPilotIds = new Set(myPilots.map((pilot) => pilot.id));
   return {
     profile: sanitizeUser(user),
     startups: fetchStartups,
     startupCount: fetchStartups.length,
     availableChallenges: seededChallenges.filter((challenge) => ['open', 'in_review'].includes(challenge.status)),
     myProposals,
     myPilots,
     myMilestones: seededMilestones.filter((m) => myPilotIds.has(m.pilot_id)),
     myKpis: seededKpis.filter((kpi) => kpi.pilot_id && myPilotIds.has(kpi.pilot_id)),
     mySnapshots: seededSnapshots.filter((snapshot) => myPilotIds.has(snapshot.pilot_id)),
     myEvaluations: seededEvaluations.filter((evaluation) => myProposals.some((proposal) => proposal.id === evaluation.proposal_id)),
     myAgreements: seededContracts.filter((c) => myPilotIds.has(c.pilot_id)),
     myMeetings: seededMeetings.filter((m) => myPilotIds.has(m.pilot_id)),
     legalTemplates: [],
     users: users && users.length ? users : [],
     notifications: seededNotifications,
   };
  }

  if (role === 'expert') {
   return {
     profile: sanitizeUser(user),
     startups: fetchStartups,
     startupCount: fetchStartups.length,
     proposals: seededProposals,
     evaluations: seededEvaluations.filter((evaluation) => evaluation.expert_id === user.id),
     challenges: seededChallenges,
     pilots: seededPilots,
     users: users && users.length ? users : [],
     notifications: seededNotifications,
   };
  }

  if (role === 'admin') {
   return {
     profile: sanitizeUser(user),
     startups: fetchStartups,
     startupCount: fetchStartups.length,
     users: users && users.length ? users : [],
     challenges: seededChallenges,
     proposals: seededProposals,
     pilots: seededPilots,
     evaluations: seededEvaluations,
     kpis: seededKpis,
     snapshots: seededSnapshots,
     scaleDecisions: seededScaleDecisions,
     notifications: seededNotifications,
   };
  }

  return {
   profile: sanitizeUser(user),
   startups: fetchStartups,
   startupCount: fetchStartups.length,
   challenges: seededChallenges,
   proposals: seededProposals,
   pilots: seededPilots,
   evaluations: seededEvaluations,
   kpis: seededKpis,
   snapshots: seededSnapshots,
   scaleDecisions: seededScaleDecisions,
   milestones: seededMilestones,
   contracts: seededContracts,
   meetings: seededMeetings,
   experts: (users || []).filter((candidate) => candidate.role === 'expert'),
   notifications: seededNotifications,
  };
}

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.use(express.json());
app.use('/api', rateLimiter);
app.use(express.static(path.join(__dirname, '..', 'public')));

async function handleSwitchRole(req, res) {
  try {
   const role = String(req.body?.role || req.query?.role || '').toLowerCase();
   if (!VALID_ROLES.includes(role)) {
     return res.status(400).json({ error: 'Valid role is required' });
   }

   const user = await getUserForRole(role);
   if (!user) {
     return res.status(404).json({ error: 'No user found for role' });
   }

   return res.json({ ok: true, role, user: sanitizeUser(user) });
  } catch (err) {
   return res.status(500).json({ error: err.message || 'Failed to switch role' });
  }
}

app.get('/api/auth/switch-role', handleSwitchRole);
app.get('/api/switch-role', handleSwitchRole);
app.post('/api/auth/switch-role', handleSwitchRole);
app.post('/api/switch-role', handleSwitchRole);

async function handlePortal(req, res) {
  try {
   const role = String(req.query?.role || req.headers['x-role'] || req.params?.role || 'government').toLowerCase();
   const user = await getUserForRole(role);
   if (!user) {
     return res.status(404).json({ error: 'Portal user not found' });
   }

   const startups = getSeedStartups();
   const challenges = getSeedChallenges();
   const payload = {
     profile: sanitizeUser(user),
     startups,
     startupCount: startups.length,
     challenges,
     challengeCount: challenges.length,
     proposals: [],
     pilots: [],
     evaluations: [],
     notifications: [],
     availableChallenges: challenges.filter((challenge) => ['open', 'in_review'].includes(challenge.status)),
     myProposals: [],
     myPilots: [],
     myMilestones: [],
     myAgreements: [],
     legalTemplates: [],
     users: [],
   };

   return res.json(payload);
  } catch (err) {
   return res.status(500).json({ error: err.message || 'Failed to load portal data' });
  }
}

app.get('/api/portal', handlePortal);
app.get('/api/startup/portal', (req, res) => handlePortal({ ...req, params: { ...req.params, role: 'startup' } }, res));
app.get('/api/expert/portal', (req, res) => handlePortal({ ...req, params: { ...req.params, role: 'expert' } }, res));
app.get('/api/admin/portal', (req, res) => handlePortal({ ...req, params: { ...req.params, role: 'admin' } }, res));

app.get('/api/startups', (req, res) => {
  try {
   const startups = getSeedStartups();
   const { sector, q } = req.query || {};
   let results = startups;

   if (sector) {
     results = results.filter((startup) => startup.sector && startup.sector.toLowerCase().includes(String(sector).toLowerCase()));
   }
   if (q) {
     const needle = String(q).toLowerCase();
     results = results.filter((startup) => [startup.name, startup.legalName, startup.sector].some((field) => String(field || '').toLowerCase().includes(needle)));
   }

   return res.json({ count: results.length, startups: results, data: results });
  } catch (err) {
   return res.status(500).json({ error: err.message || 'Failed to load startups' });
  }
});

app.get('/api/challenges', async (req, res) => {
  try {
   const { status, proposal_id } = req.query;
   let challenges = getSeedChallenges();

   if (status) { challenges = challenges.filter((challenge) => challenge.status === status); }
   if (proposal_id) {
     const proposals = [];
     const proposal = proposals.find((item) => item.id === proposal_id);
     if (proposal) {
       challenges = challenges.filter((challenge) => challenge.id === proposal.challenge_id);
     }
   }

   challenges.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
   return res.json({ count: challenges.length, challenges, data: challenges });
  } catch (err) {
   return res.status(500).json({ error: err.message || 'Failed to load challenges' });
  }
});

app.get('/api/challenge/:id', async (req, res) => {
  try {
   const challenge = await db.getChallengeById(req.params.id);
   if (!challenge) {
     return res.status(404).json({ error: 'Challenge not found' });
   }
   return res.json(challenge);
  } catch (err) {
   return res.status(500).json({ error: err.message || 'Failed to load challenge' });
  }
});

app.get('/api/challenges/:id', async (req, res) => {
  try {
   const challenge = await db.getChallengeById(req.params.id);
   if (!challenge) {
     return res.status(404).json({ error: 'Challenge not found' });
   }
   return res.json(challenge);
  } catch (err) {
   return res.status(500).json({ error: err.message || 'Failed to load challenge' });
  }
});

app.post('/api/challenges', async (req, res) => {
  try {
   const payload = req.body || {};
   if (!payload.title || !payload.description || !payload.problem_statement) {
     return res.status(400).json({ error: 'title, description, and problem_statement are required' });
   }

   const created = await db.insert('challenges', {
     id: require('uuid').v4(),
     title: payload.title,
     description: payload.description,
     problem_statement: payload.problem_statement,
     desired_outcomes: payload.desired_outcomes || '',
     success_criteria: payload.success_criteria || '',
     budget_range: payload.budget_range || null,
     duration_weeks: payload.duration_weeks || 12,
     status: payload.status || 'open',
     priority: payload.priority || 'medium',
     department: payload.department || '',
     contact_person: payload.contact_person || '',
     tags: payload.tags || '',
     ai_match_enabled: payload.ai_match_enabled ?? 1,
     min_expert_evaluations: payload.min_expert_evaluations ?? 2,
     created_by: payload.created_by || (await getUserForRole('government'))?.id || 'system',
     created_at: new Date().toISOString(),
     updated_at: new Date().toISOString(),
   });

   return res.status(201).json(created);
  } catch (err) {
   return res.status(500).json({ error: err.message || 'Failed to create challenge' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/pilots', pilotRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/security', secureRoutes);
app.use('/api/risks', riskRoutes);

app.get('/api/dashboard', async (req, res) => {
  try {
   const startups = getSeedStartups();
   const allChallenges = (await db.getAll('challenges')).length ? await db.getAll('challenges') : getSeedChallenges();
   const proposalRows = (await db.getAll('proposals')).length ? await db.getAll('proposals') : [];
   const allUsers = await db.getAll('users');
   const allProposals = await ProposalService.enrichProposals(proposalRows, allUsers);
   const allPilots = (await db.getAll('pilots')).length ? await db.getAll('pilots') : [];

   const openChallenges = allChallenges.filter((row) => row.status === 'open');
   const proposalsInReview = allProposals.filter((row) => row.status === 'under_review');
   const activePilots = allPilots.filter((row) => row.status === 'active');
   const totalSpend = allPilots.reduce((sum, pilot) => sum + (parseFloat(pilot.budget_spent) || 0), 0);

   res.json({
     open_challenges: openChallenges.length,
     proposals_in_review: proposalsInReview.length,
     active_pilots: activePilots.length,
     total_spend: totalSpend,
     startup_count: startups.length,
     startups,
     challenges: allChallenges,
     proposals: allProposals,
     pilots: allPilots,
     counts: {
       startups: startups.length,
       challenges: allChallenges.length,
       proposals: allProposals.length,
       pilots: allPilots.length,
     },
   });
  } catch (err) {
   res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Milestones API                                                      */
/* ------------------------------------------------------------------ */

app.get('/api/milestones', async (req, res) => {
  try {
    const { pilot_id } = req.query;
    let milestones = await db.getAll('milestones');
    if (pilot_id) milestones = milestones.filter(m => m.pilot_id === pilot_id);
    milestones.sort((a, b) => (a.seq || 0) - (b.seq || 0));
    res.json({ count: milestones.length, milestones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/milestones/:id', async (req, res) => {
  try {
    const milestones = await db.getAll('milestones');
    const ms = milestones.find(m => m.id === req.params.id);
    if (!ms) return res.status(404).json({ error: 'Milestone not found' });
    res.json(ms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/milestones/:id/submit', async (req, res) => {
  try {
    const milestones = await db.getAll('milestones');
    const idx = milestones.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Milestone not found' });
    const { evidenceNames = [] } = req.body || {};
    const now = new Date().toISOString();
    const evidence = evidenceNames.map(name => ({ name, kind: 'report', uploaded_at: now }));
    const updated = await db.update('milestones', req.params.id, {
      status: 'submitted',
      submitted_at: now,
      evidence: [...(milestones[idx].evidence || []), ...evidence],
    });
    res.json(updated || milestones[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/milestones/:id/review', async (req, res) => {
  try {
    const { decision, notes } = req.body || {};
    if (!['approved', 'rejected', 'under_review'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }
    const now = new Date().toISOString();
    const updated = await db.update('milestones', req.params.id, {
      status: decision,
      reviewed_at: now,
      reviewer_notes: notes || '',
    });
    if (!updated) return res.status(404).json({ error: 'Milestone not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/milestones/:id/payment', async (req, res) => {
  try {
    const { mode = 'PFMS' } = req.body || {};
    const now = new Date().toISOString();
    const utr = 'UTR' + Date.now().toString().slice(-10);
    const updated = await db.update('milestones', req.params.id, {
      status: 'paid',
      paid_at: now,
      payment_utr: utr,
      payment_mode: mode,
    });
    if (!updated) return res.status(404).json({ error: 'Milestone not found' });

    // Update pilot budget_spent
    const milestones = await db.getAll('milestones');
    const ms = milestones.find(m => m.id === req.params.id);
    if (ms) {
      const pilotMilestones = milestones.filter(m => m.pilot_id === ms.pilot_id && m.status === 'paid');
      const totalPaid = pilotMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);
      await db.update('pilots', ms.pilot_id, { budget_spent: totalPaid });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Contracts / Agreements API                                          */
/* ------------------------------------------------------------------ */

app.get('/api/contracts', async (req, res) => {
  try {
    const { pilot_id } = req.query;
    let contracts = await db.getAll('contracts');
    if (pilot_id) contracts = contracts.filter(c => c.pilot_id === pilot_id);
    res.json({ count: contracts.length, contracts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const body = req.body || {};
    const now = new Date().toISOString();
    const contract = await db.insert('contracts', {
      id: 'CT-' + require('uuid').v4().slice(0, 8),
      pilot_id: body.pilot_id,
      template_ids: body.template_ids || ['TPL-AGREE', 'TPL-DATA', 'TPL-IP'],
      reference_no: body.reference_no || `MSINS/AGR/${new Date().getFullYear()}/${String(Math.floor(Math.random()*999)+1).padStart(3,'0')}`,
      status: 'draft',
      ip_ownership: body.ip_ownership || 'startup_owned_govt_licence',
      data_classification: body.data_classification || 'restricted',
      data_retention_months: body.data_retention_months || 36,
      data_residency_in_india: body.data_residency_in_india ?? true,
      cybersecurity_compliance: body.cybersecurity_compliance || 'CERT-In guidelines; data encrypted at rest and in transit.',
      risk_controls: body.risk_controls || 'Monthly review, auto-termination on KPI deviation > 30%, escrow for final tranche.',
      generated_at: now,
      sent_at: null,
      startup_signed_at: null,
      executed_at: null,
      executed_by: null,
      notes: body.notes || '',
    });
    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contracts/:id/send', async (req, res) => {
  try {
    const updated = await db.update('contracts', req.params.id, {
      status: 'sent_to_startup',
      sent_at: new Date().toISOString(),
    });
    if (!updated) return res.status(404).json({ error: 'Contract not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contracts/:id/sign', async (req, res) => {
  try {
    const { otp } = req.body || {};
    // Simulated OTP verification - accept any 6-digit code or "123456"
    if (otp && otp.length === 6) {
      const updated = await db.update('contracts', req.params.id, {
        status: 'signed_by_startup',
        startup_signed_at: new Date().toISOString(),
      });
      if (!updated) return res.status(404).json({ error: 'Contract not found' });
      res.json({ ...updated, otp_verified: true });
    } else {
      res.status(400).json({ error: 'Valid 6-digit OTP required for e-signing' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contracts/:id/execute', async (req, res) => {
  try {
    const updated = await db.update('contracts', req.params.id, {
      status: 'executed',
      executed_at: new Date().toISOString(),
      executed_by: req.body?.executed_by || 'gov-user',
    });
    if (!updated) return res.status(404).json({ error: 'Contract not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Meetings API                                                        */
/* ------------------------------------------------------------------ */

app.get('/api/meetings', async (req, res) => {
  try {
    const { pilot_id } = req.query;
    let meetings = await db.getAll('meetings');
    if (pilot_id) meetings = meetings.filter(m => m.pilot_id === pilot_id);
    meetings.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    res.json({ count: meetings.length, meetings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meetings', async (req, res) => {
  try {
    const body = req.body || {};
    const meeting = await db.insert('meetings', {
      id: 'MT-' + require('uuid').v4().slice(0, 8),
      pilot_id: body.pilot_id,
      title: body.title || 'Review Meeting',
      date: body.date || new Date().toISOString(),
      attendees: body.attendees || [],
      agenda: body.agenda || '',
      notes: body.notes || '',
      action_items: body.action_items || [],
      status: body.status || 'scheduled',
      created_at: new Date().toISOString(),
    });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/meetings/:id', async (req, res) => {
  try {
    const updated = await db.update('meetings', req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Meeting not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Eligibility Screening API                                           */
/* ------------------------------------------------------------------ */

app.get('/api/screening/:startupId', async (req, res) => {
  try {
    const startups = getSeedStartups();
    const startup = startups.find(s => s.id === req.params.startupId);
    if (!startup) {
      // Try from users table
      const user = await db.getUserById(req.params.startupId);
      if (!user) return res.status(404).json({ error: 'Startup not found' });
      const result = ScreeningService.autoScreenStartup({
        dpiitNumber: user.dpiit_number,
        trl_level: user.trl_level || 6,
        techStack: user.expertise ? user.expertise.split(',') : [],
        teamSize: user.team_size || 0,
        turnover: user.annual_turnover || 0,
        dpiitRecognized: user.dpiit_verified,
      });
      return res.json(result);
    }
    const result = ScreeningService.autoScreenStartup(startup);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/screening/proposal/:proposalId', async (req, res) => {
  try {
    const proposal = await db.getProposalById(req.params.proposalId);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    const startups = getSeedStartups();
    const startup = startups.find(s => s.id === proposal.startup_id) || {};
    const result = ScreeningService.autoScreenStartup({
      ...startup,
      challengeBudget: proposal.budget_estimate,
    });
    res.json({ proposal_id: proposal.id, screening: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Pilot Progress Update API                                           */
/* ------------------------------------------------------------------ */

app.put('/api/pilots/:id/progress', async (req, res) => {
  try {
    const { progress_percentage, notes } = req.body || {};
    const changes = {};
    if (progress_percentage != null) changes.progress_percentage = Math.min(100, Math.max(0, Number(progress_percentage)));
    if (notes) changes.summary = notes;
    const updated = await db.update('pilots', req.params.id, changes);
    if (!updated) return res.status(404).json({ error: 'Pilot not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Legal Templates API                                                 */
/* ------------------------------------------------------------------ */

const LEGAL_TEMPLATES = [
  {
    id: 'TPL-AGREE', code: 'MSINS/TPL/AGREE/v3', name: 'Pilot Agreement',
    category: 'agreement', version: '3.0',
    description: 'Standard pilot agreement template for MSINS innovation challenges.',
    clauses: [
      { heading: 'Scope of Work', body: 'The Startup shall deliver the solution as described in the accepted proposal, adhering to the milestone plan and KPI targets.', mandatory: true },
      { heading: 'Duration', body: 'The pilot shall run for the agreed duration unless terminated earlier per the exit clause.', mandatory: true },
      { heading: 'Governing Law', body: 'This agreement is governed by the laws of India and the jurisdiction of Maharashtra courts.', mandatory: true },
    ],
    compliance_refs: ['GFR 2017 Rule 170(i)', 'DPIIT Circular 2019', 'IT Act 2000'],
    applicable_to: 'all', owner: 'MSINS Legal', status: 'active', last_updated: '2026-01-15',
  },
  {
    id: 'TPL-DATA', code: 'MSINS/TPL/DATA/v2', name: 'Data Handling & Privacy',
    category: 'data', version: '2.0',
    description: 'Data classification, handling, retention and privacy clauses for pilot deployments.',
    clauses: [
      { heading: 'Data Classification', body: 'All data shall be classified as Public, Restricted, or Confidential. Default is Restricted.', mandatory: true },
      { heading: 'Data Residency', body: 'All citizen data must remain within Indian territory on government-approved infrastructure.', mandatory: true },
      { heading: 'Data Retention', body: 'Data shall be retained for the agreed period and securely destroyed thereafter.', mandatory: true },
      { heading: 'Privacy Compliance', body: 'Processing of personal data must comply with the Digital Personal Data Protection Act, 2023.', mandatory: true },
    ],
    compliance_refs: ['DPDP Act 2023', 'CERT-In Directions 2022', 'MeitY Cloud Guidelines'],
    applicable_to: 'all', owner: 'MSINS Legal', status: 'active', last_updated: '2026-02-10',
  },
  {
    id: 'TPL-IP', code: 'MSINS/TPL/IP/v2', name: 'Intellectual Property',
    category: 'ip', version: '2.0',
    description: 'IP ownership, licensing and rights clauses for innovation pilots.',
    clauses: [
      { heading: 'Background IP', body: 'Each party retains ownership of its pre-existing intellectual property.', mandatory: true },
      { heading: 'Foreground IP', body: 'IP created during the pilot belongs to the Startup with a perpetual, royalty-free licence to the Government for the solution as deployed.', mandatory: true },
      { heading: 'Open Source', body: 'Use of open-source components must be disclosed and compatible with the licence-back model.', mandatory: false },
    ],
    compliance_refs: ['DPIIT IP Policy 2016', 'Patent Act 1970'],
    applicable_to: 'all', owner: 'MSINS Legal', status: 'active', last_updated: '2026-01-20',
  },
  {
    id: 'TPL-PAY', code: 'MSINS/TPL/PAY/v2', name: 'Payment & Milestone Terms',
    category: 'payment', version: '2.0',
    description: 'Milestone-based payment schedule, verification, and disbursement terms.',
    clauses: [
      { heading: 'Payment Schedule', body: 'Payments are linked to verified milestone completion. No advance payments without explicit approval.', mandatory: true },
      { heading: 'Verification', body: 'Each milestone must be independently verified before payment release.', mandatory: true },
      { heading: 'Payment Mode', body: 'Payments via PFMS/NEFT/RTGS within 15 working days of milestone approval.', mandatory: true },
      { heading: 'Penalty', body: 'Delayed milestone submission beyond 30 days attracts a 2% penalty per month.', mandatory: false },
    ],
    compliance_refs: ['GFR 2017', 'PFMS Guidelines'],
    applicable_to: 'all', owner: 'MSINS Finance', status: 'active', last_updated: '2026-03-01',
  },
  {
    id: 'TPL-EXIT', code: 'MSINS/TPL/EXIT/v1', name: 'Exit & Termination',
    category: 'exit', version: '1.0',
    description: 'Conditions and process for pilot termination, data handback, and wind-down.',
    clauses: [
      { heading: 'Termination for Convenience', body: 'Either party may terminate with 30 days written notice.', mandatory: true },
      { heading: 'Termination for Cause', body: 'Immediate termination for material breach, fraud, or KPI deviation exceeding 30%.', mandatory: true },
      { heading: 'Data Handback', body: 'On termination, all government data must be returned and copies securely destroyed within 30 days.', mandatory: true },
    ],
    compliance_refs: ['Indian Contract Act 1872'],
    applicable_to: 'all', owner: 'MSINS Legal', status: 'active', last_updated: '2026-01-25',
  },
];

app.get('/api/legal-templates', (req, res) => {
  res.json({ count: LEGAL_TEMPLATES.length, templates: LEGAL_TEMPLATES });
});

app.get('/api/legal-templates/:id', (req, res) => {
  const tpl = LEGAL_TEMPLATES.find(t => t.id === req.params.id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  res.json(tpl);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

async function startServer() {
  try {
   await db.initDb();
   console.log('PostgreSQL database initialized with seed data');
   console.log('Demo accounts:');
   console.log('  officer@govpilot.gov / password123 (Government)');
   console.log('  startup@innovate.ai / password123 (Startup)');
   console.log('  expert@university.edu / password123 (Expert)');
   console.log('  admin@govpilot.gov / password123 (Admin)');

   server = app.listen(PORT, () => {
     console.log(`GovPilot OS running on http://localhost:${PORT}`);
   });
  } catch (err) {
   console.warn('Database initialization failed; starting in demo mode with in-memory seed data.', err.message);
   server = app.listen(PORT, () => {
     console.log(`GovPilot OS running on http://localhost:${PORT} (demo mode)`);
   });
  }
}

let server;
let shuttingDown = false;

async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Shutting down on ${signal}...`);

  if (typeof db.shutdown === 'function') {
   await db.shutdown();
  }

  if (server && typeof server.close === 'function') {
   server.close(() => process.exit(0));
   return;
  }

  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();