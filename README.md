# DataScope

DataScope is a minimal, high-performance internal data portal built with **Next.js (App Router)** and **Express.js**. It features a dynamic query engine backed by PostgreSQL JSONB storage, Redis caching, schema-driven filtering, audit history tracking, and role-based access control.

---

## Key Features

- **Dynamic Query Engine & Filter Builder**: Combine global full-text and trigram partial matching with type-aware field conditions (equality, ranges, date intervals, select options). Supports `AND` / `OR` logic, multi-column sorting (up to 3 columns), and real-time backend validation.
- **High-Performance Storage & Caching**: PostgreSQL JSONB dynamic attributes powered by GIN, B-tree, and expression indexes. Upstash Redis caches query payloads and total counts with automated dataset version-based cache busting.
- **Record Inspection & Audit History**: Slide-over inspection drawer displaying full record values, field-level change history (`oldValue → newValue`) with user attribution, and bidirectional relational graphs (incoming & outgoing links).
- **Saved Views & Search History**: Save and name search presets, share configurations with specific users, and instantly re-run past queries from the recent search history drawer.
- **Analytics Dashboard**: Real-time SQL aggregation charts for categorical distributions, record growth rates (Day / Week / Month), daily search frequencies, and query latency metrics.
- **Admin Console & Granular Permissions**: Full administration module to manage user accounts, define datasets, configure custom schema fields, and set per-dataset access levels (`None`, `View`, `Manage`).
- **Role-Based Access Control (RBAC)**: Enforces three distinct user tiers (`ADMIN`, `ANALYST`, `VIEWER`) across all backend API middleware and frontend UI controls.
---

## Architecture Overview

```
datascope/
├── client/     # Frontend: Next.js 14 + React + TypeScript + Tailwind CSS
├── server/     # Backend: Express.js (ESM) + PostgreSQL (JSONB) + Redis
└── README.md
```

### Backend (`server/`)
- **Runtime & Framework**: Node.js with Express.js (ES Modules).
- **Primary Database**: PostgreSQL with Neon serverless driver and `pg` pool. Dynamic attributes are stored in JSONB columns indexed with GIN (trigram & full-text), B-tree, and expression indexes.
- **Cache Layer**: Upstash Redis for query and result count caching with dataset version-based cache busting.
- **Security & Auth**: JWT authentication (`/auth/login`, `/auth/register`, `/auth/me`), bcrypt password hashing, and role/dataset authorization middleware.
- **Core Endpoints**:
  - `/api/v1/datasets`: Dataset catalog and dynamic schema field configuration.
  - `/api/v1/datasets/:id/records/search`: Multi-condition search, sorting, and pagination.
  - `/api/v1/datasets/:id/records`: Record CRUD, field-level audit history, and graph relationships.
  - `/api/v1/saved-views`: Save search configurations, update presets, and share views with users.
  - `/api/v1/search-history`: User search activity logging and recent query recall.
  - `/api/v1/analytics`: Overview KPIs (Admin), categorical distributions, time-series growth, and filter metrics.
  - `/api/v1/users` & `/permissions`: Admin user administration and per-dataset access level mapping (`view` / `manage`).

### Frontend (`client/`)
- **Framework**: Next.js 14 (App Router) strictly client-rendered (`"use client"`).
- **Styling**: Tailwind CSS with custom dark mode toggle (`class` strategy) and developer-console aesthetic (plain surfaces, thin borders, zero animation).
- **State & Data**: Custom React hooks (`useSearch`, `useSearchState`, `useDatasetFields`, `useDebounce`) directly consuming `lib/api.ts`.
- **Visualization**: Recharts for categorical distributions, growth tracking, and latency analytics.
- **Key Modules**:
  - **Explorer**: Global fulltext/trigram search, dynamic type-aware filter builder (AND/OR logic), sorting (up to 3 columns), and column visibility picker.
  - **Record Inspection**: Slide-over drawer showing record values, field-level audit change logs (`old → new`), and incoming/outgoing relational links.
  - **Saved Views & History**: Save search presets, share with other accounts, and reload recent searches.
  - **Analytics**: Platform overview KPI cards, category/status charts, growth intervals, and search latency metrics.
  - **Admin Console**: User management, dataset CRUD, custom field schema definitions, and granular user permissions.

---

## Getting Started

### 1. Backend Setup

```bash
cd server
npm install

# Configure environment variables in server/.env (see server/.env.example)
# DATABASE_URL=postgresql://...
# REDIS_URL=redis://...
# JWT_SECRET=your_32_character_jwt_secret_key...
# FRONTEND_URL=http://localhost:3001
# PORT=3000

# Run migrations and seed sample datasets
npm run db:setup

# Start backend server (port 3000)
npm run dev      # or: npm start
```

### 2. Frontend Setup

```bash
cd client
npm install

# Verify NEXT_PUBLIC_API_URL in client/.env.local (default: http://localhost:3000/api/v1)

# Start development server (port 3001)
npm run dev

# Or compile production build
npm run build && npm start
```

Open **[http://localhost:3001](http://localhost:3001)** in your browser.

---

## Default Demo Accounts

All demo users share the default password configured in `DEMO_USER_PASSWORD` (default: `Password123!`):

| Role | Email | Capabilities |
|---|---|---|
| **Admin** | `admin@datascope.dev` | Full platform access, admin console, KPI overview, dataset & schema editing, user permissions. |
| **Analyst** | `analyst@datascope.dev` | Advanced filtering, save & share views, create & edit records on authorized datasets. |
| **Viewer** | `viewer@datascope.dev` | Read-only browsing, basic operators (`eq`, `contains`), load shared views. |

---

## Production Build & Verification

```bash
# In client/
npm run lint     # Check ESLint (0 errors, 0 warnings)
npm run build    # Compile all routes as static client bundles
```

## Author & Support

**Farhad Nuri**
- **GitHub:** [@FarhadNuri](https://github.com/FarhadNuri)
- **LinkedIn:** [Farhad Nuri](https://www.linkedin.com/in/farhad-nuri-ba99a62a5/)
- **Email:** farhadnuri559@gmail.com

---