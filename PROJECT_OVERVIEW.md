# GovPilot OS - Complete Project Overview

## Project Summary
**GovPilot OS** is a digital platform for government-startup innovation pilots, implementing the Maharashtra State Innovation Society (MSINS) innovation pilot program. The project is a full-stack application built with:
- **Backend**: Express.js (Node.js) with PostgreSQL/SQLite database
- **Frontend**: Next.js 14 with React 18 and TypeScript
- **Authentication**: JWT-based token authentication with bcrypt password hashing
- **Roles**: Government Officers, Startups, Expert Evaluators, Platform Admins

---

## Project Structure

### Root Directory (`C:\Users\anura\33`)
```
├── package.json                  # Root npm configuration
├── package-lock.json
├── GovPilotOS/                   # Main project directory
│   ├── .git/                     # Git repository
│   ├── .gitignore
│   ├── package.json              # Project configuration
│   ├── node_modules/             # Dependencies
│   ├── public/                   # Static assets for backend
│   ├── server/                   # Express.js backend
│   └── web/                      # Next.js frontend
└── .kilo/                        # Kilo configuration files
```

---

## Backend Architecture (`server/`)

### Entry Point: `server/index.js`
- Express server running on port 5000 (default)
- CORS enabled
- Serves static files from `public/`
- Routes mounted at `/api/*`
- Demo accounts pre-configured

### Database Layer (`server/db/`)

#### `schema.js` - SQLite Schema Definition
**Tables:**
- `users` - User accounts with roles (government, startup, expert, admin)
- `challenges` - Government-created innovation challenges
- `proposals` - Startup proposals in response to challenges
- `evaluations` - Expert evaluations of proposals (scored 1-5)
- `pilots` - Approved proposals that move to pilot phase
- `kpis` - Key Performance Indicators for challenges/pilots
- `kpi_snapshots` - Historical KPI measurements
- `scale_decisions` - Post-pilot decisions (procure/scale/iterate/reject)
- `notifications` - User notifications
- `activity_log` - Audit trail of all actions

#### `schema_postgres.sql` - PostgreSQL Alternative
Same schema for PostgreSQL production deployment

#### `store.js` - Data Access Layer
- Uses PostgreSQL Pool (`pg` library)
- Connection pooling with 20 max connections
- Async/await interface for all queries
- Environment variable: `DATABASE_URL`

#### `seed.js` - Demo Data
Pre-populated demo data with 7 users and sample challenges/proposals

### Authentication (`server/middleware/auth.js`)
- JWT secret: `govpilot-secret-key-2025`
- `authenticate()` - Validate token middleware
- `authorize(...roles)` - Role-based access control
- `logActivity()` - Audit logging
- Token expiration: 7 days

### API Routes (`server/routes/`)

| Route | Purpose | Methods |
|-------|---------|---------|
| `/api/auth` | Authentication | POST register/login, GET me |
| `/api/challenges` | Challenge management | GET, POST, PUT, DELETE |
| `/api/proposals` | Proposal submission | GET, POST, PUT |
| `/api/evaluations` | Expert scoring | GET, POST, PUT |
| `/api/pilots` | Pilot management | GET, POST, PUT |
| `/api/kpis` | KPI tracking | GET, POST, PUT |
| `/api/admin` | Administration | Various |
| `/api/ai` | AI matching | GET, POST |

---

## Frontend Architecture (`web/`)

### Core Configuration Files
- `package.json` - Next.js 14.2.5, React 18.3.1, TypeScript
- `tsconfig.json` - TypeScript configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS for styling

### App Structure (`web/app/`)

| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout with metadata |
| `page.tsx` | Home page entry (mounts AppShell) |
| `globals.css` | Global styles |

### Components (`web/src/components/`)

| Component | Purpose |
|-----------|---------|
| `app-shell.tsx` | Main app container with role switcher |
| `government-dashboard.tsx` | Government officer view |
| `startup-portal.tsx` | Startup view with proposals |
| `expert-evaluation.tsx` | Expert scoring interface |
| `admin-console.tsx` | Platform administration |
| `procurement-scale-up.tsx` | Scale-up decisions |
| `startup-registration.tsx` | DPIIT compliance form |
| `shared.tsx` | Shared UI components (badges, charts) |
| `ui.tsx` | Base UI components (Button, Card, Dialog, etc.) |

### Utility Modules (`web/src/lib/`)

| Module | Purpose |
|--------|---------|
| `types.ts` | TypeScript domain models |
| `api.ts` | API facade with fallback pattern |
| `store.ts` | In-memory mock store |
| `mock-data.ts` | Demo dataset |
| `derive.ts` | Derived data calculations |
| `utils.ts` | Helper functions |

---

## Key Domain Models (TypeScript)

### User
```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  role: "government" | "startup" | "expert" | "admin";
  organization?: string;
  designation?: string;
  // Startup-specific compliance fields
  dpiit_number?: string;
  dpiit_verified?: boolean;
  cin?: string;
  gstin?: string;
  udyam_number?: string;
  annual_turnover?: number;
  annual_profit_loss?: number;
}
```

### Challenge
```typescript
interface Challenge {
  id: string;
  challenge_code: string;  // e.g., MSINS/PWD/2026/001
  title: string;
  description: string;
  problem_statement: string;
  desired_outcomes: string;
  success_criteria: string;
  budget_range: string;
  duration_weeks: number;
  status: ChallengeStatus;
  priority: Priority;
  department: string;
  contact_person: string;
  tags: string;
  ai_match_enabled: boolean;
  min_expert_evaluations: number;
  created_by: string;  // User ID
  created_at: string;
  updated_at: string;
}
```

### Proposal
```typescript
interface Proposal {
  id: string;
  challenge_id: string;
  startup_id: string;
  title: string;
  description: string;
  solution_approach: string;
  timeline_weeks: number;
  budget_estimate: number;
  team_description: string;
  past_projects?: string;
  innovation_score?: number;      // 1-5
  feasibility_score?: number;     // 1-5
  impact_score?: number;          // 1-5
  overall_score?: number;         // Averaged
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
}
```

### Evaluation
```typescript
interface Evaluation {
  id: string;
  proposal_id: string;
  expert_id: string;
  innovation_score: number;       // 1-5
  feasibility_score: number;      // 1-5
  impact_score: number;           // 1-5
  overall_comment: string;
  recommendation: "strongly_reject" | "reject" | "neutral" | "accept" | "strongly_accept";
  confidence_level: number;       // 1-5
  created_at: string;
  updated_at: string;
}
```

### Pilot
```typescript
interface Pilot {
  id: string;
  proposal_id: string;
  challenge_id: string;
  startup_id: string;
  status: PilotStatus;  // planned, active, paused, completed, terminated, scaled
  start_date: string;
  end_date?: string;
  budget_allocated: number;
  budget_spent: number;
  progress_percentage: number;
  summary?: string;
  outcomes?: string;
  lessons_learned?: string;
  created_at: string;
  updated_at: string;
}
```

### KPI
```typescript
interface Kpi {
  id: string;
  challenge_id?: string;
  pilot_id?: string;
  name: string;
  description: string;
  metric_type: "quantitative" | "qualitative" | "milestone";
  unit?: string;
  target_value?: number;
  target_description?: string;
  weight: number;  // Default: 1.0
  created_at: string;
}
```

---

## Demo Accounts

All use password: `password123`

| Email | Role | Organization |
|-------|------|--------------|
| officer@govpilot.gov | Government | Ministry of Digital Affairs |
| startup@innovate.ai | Startup | InnovateAI Solutions |
| startup2@green.tech | Startup | GreenTech Labs |
| startup3@health.tech | Startup | HealthBridge Technologies |
| expert@university.edu | Expert | State University |
| expert2@consulting.com | Expert | Policy Insights Consulting |
| admin@govpilot.gov | Admin | GovPilot Platform |

---

## Application Workflows

### 1. Challenge Formulation
- Government officer creates challenge
- Defines problem, outcomes, criteria, budget
- Sets minimum expert evaluators (default: 2)
- Publishes challenge (status: "open")

### 2. Proposal Submission
- Startup registers with DPIIT compliance
- Discovers challenges
- Submits proposal with solution approach
- Status: "submitted"

### 3. Expert Evaluation
- Expert reviews proposals
- Scores on innovation, feasibility, impact (1-5)
- Provides recommendation
- Automatic averaging when min evaluations met

### 4. Pilot Launch
- Government officer reviews evaluations
- Creates pilot from top proposals
- Allocates budget and KPIs
- Status: "active"

### 5. Execution & Tracking
- Startup executes pilot
- Reports progress and KPI measurements
- Government tracks budget and milestones
- Expert assesses performance

### 6. Scale Decision
- Decision types: procure, scale_pilot, iterate, reject
- Budget and timeline allocated
- GeM integration for procurement
- Archive and document outcomes

---

## Technology Stack

**Backend:** Express.js 4.22.2, Node.js
**Database:** PostgreSQL 8.23.0 or SQLite3
**Frontend:** Next.js 14.2.5, React 18.3.1, TypeScript
**Styling:** Tailwind CSS 3.4.6
**Authentication:** JWT + bcryptjs
**Build:** Webpack (via Next.js)

---

## Running the Application

### Backend
```bash
cd GovPilotOS
npm install
npm run start
```
Runs on http://localhost:5000

### Frontend
```bash
cd GovPilotOS/web
npm install
npm run dev
```
Runs on http://localhost:3000

### Database
```bash
cd GovPilotOS
npm run init-db
```

---

## Key Features

✅ Multi-role platform (Government, Startup, Expert, Admin)
✅ Challenge formulation with outcome-based metrics
✅ Proposal submission and tracking
✅ Expert evaluation panel (1-5 scoring)
✅ Pilot lifecycle management
✅ KPI measurement and reporting
✅ Compliance tracking (DPIIT, GST, etc.)
✅ Payment milestone tracking
✅ Scale-up decision workflow
✅ Activity audit trail
✅ Offline fallback with mock store
✅ Responsive design with Tailwind CSS
✅ Full role-based access control
