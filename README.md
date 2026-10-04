# AVBank — Enterprise Cloud FinTech & Banking Platform

**A production-grade, full-stack banking platform rebuilt from a Python/MySQL CLI into a high-concurrency cloud FinTech system with FastAPI microservices, async PostgreSQL, Redis-backed fraud detection, real-time WebSockets, and an interactive Next.js 14 dashboard.**

---

## Executive Summary

### The Problem

Legacy banking software — built as monolithic CLI applications executing raw SQL queries against local databases — cannot scale, cannot secure, and cannot support the real-time expectations of modern users. Single-threaded blocking I/O, plaintext credential storage, no audit trails, and zero observability make these systems both a compliance liability and an operational bottleneck. The original `AVBANK FINAL.py` is a representative example: a 1,500-line Python script executing raw `PyMySQL` queries against a local MySQL instance with no hashing, no token-based auth, and no concurrent access support.

### The Solution

AVBank v2.0.0 is a ground-up cloud-native rewrite of that legacy system. It exposes a fully asynchronous REST API via FastAPI, backed by PostgreSQL 16 with a SQLAlchemy 2.0 async ORM, Redis 7 for distributed caching and fraud velocity tracking, and a Next.js 14 App Router frontend with Recharts-powered dashboards. Every credential is hashed with bcrypt. Every session is stateless JWT with refresh token rotation. Every transaction is evaluated against a multi-rule fraud detection engine before committing to the ledger. The entire platform ships as a four-container Docker Compose stack with health-checked service orchestration.

**Target users:** Banking institutions, FinTech startups, and engineering teams that need a compliant, observable, and extensible core banking system.

### Standout Technical Sub-Systems

- **Async Transaction Ledger** — ACID-compliant deposit and withdrawal engine using SQLAlchemy 2.0 async sessions with rollback isolation; balance updates and transaction records commit atomically or not at all.
- **Rule-Based Fraud Detection Engine** — Three-layer anomaly detection (high-value threshold, Redis velocity counting in a configurable time window, large round-sum withdrawal pattern) evaluated inline on every transaction before it commits, with per-transaction `is_flagged` and `fraud_reason` audit columns.
- **Real-Time WebSocket Notification System** — Per-user `ConnectionManager` that pushes typed events (`transaction`, `fraud_alert`, `loan_update`) to authenticated browser clients, with automatic 5-second client-side reconnect logic.
- **Loan Underwriting & EMI Engine** — Loan-type-specific interest rate table, reducing-balance EMI calculation using the standard annuity formula, full month-by-month amortization schedule generation, and admin-controlled approval/rejection workflow with rejection reason logging.
- **BI & Analytics Service** — Raw SQL aggregation layer computing monthly transaction volumes by type, account-type portfolio distribution, and cumulative user growth trends — all surfaced as Recharts line/bar charts in the admin dashboard.
- **JWT Auth with Refresh Token Rotation** — Short-lived access tokens (30 min) with silent refresh via a 7-day rotating refresh token; expired sessions are intercepted by an Axios response interceptor that transparently re-authenticates before retrying the original request.

---

## Evaluation Parameter Mapping

| Evaluation Criterion | Weight | Concrete Technical Implementation |
|---|---|---|
| **Technical Execution — Async Architecture** | 25% | FastAPI with `asyncpg` connection pool (pool_size=20, max_overflow=40); SQLAlchemy 2.0 `AsyncSession` + `async_sessionmaker`; all I/O is non-blocking |
| **Technical Execution — Security** | 25% | bcrypt password hashing via `passlib`; HS256 JWT access + refresh tokens via `python-jose`; RBAC (`admin`/`customer`) enforced at the dependency layer; CORS origin whitelist |
| **Problem-Solution Fit — Fraud Detection** | 20% | Inline `check_fraud()` on every transaction: Rule 1 (threshold ≥ ₹1,00,000), Rule 2 (Redis velocity counter per account over a 5-min window), Rule 3 (round-sum cash withdrawal ≥ ₹50,000); graceful Redis fallback if cache is unavailable |
| **Problem-Solution Fit — Feature Parity** | 20% | Full feature parity with the legacy CLI: accounts, transactions, cards, loans, feedback, analytics — all exposed as versioned REST endpoints under `/api/v1` |
| **Scope & Scalability — Data Layer** | 20% | PostgreSQL 16 with UUID primary keys, indexed foreign keys, `ON DELETE CASCADE` referential integrity; async connection pool; Redis distributed cache for velocity counters and rate limiting |
| **Scope & Scalability — Containerization** | 20% | Four-service Docker Compose stack (PostgreSQL, Redis, FastAPI backend, Next.js frontend) with health checks, `depends_on` conditions, and named volume persistence |
| **Deployability & Resilience — Startup** | 20% | FastAPI lifespan handler auto-creates all ORM tables on first boot; Redis connection failure is caught and logged without halting the API (graceful degradation) |
| **Deployability & Resilience — Token Refresh** | 20% | Axios interceptor transparently rotates tokens on 401; client reconnects WebSocket with exponential backoff; server connection pool recycled every 1800s |
| **Impact Potential — BI Dashboard** | 15% | Admin dashboard with Recharts visualisations of monthly transaction volume, account type distribution, and cumulative user growth; all computed server-side via raw SQL aggregations |
| **Impact Potential — Real-Time UX** | 15% | WebSocket `ConnectionManager` pushes per-user typed events to the browser instantly on transaction commit, fraud flag, and loan status change |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│              Next.js 14 App Router (Port 3000)                  │
│   ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│   │ /login       │  │ /dashboard   │  │ /admin/dashboard    │  │
│   │ /signup      │  │ /accounts    │  │ /admin/loans        │  │
│   │              │  │ /cards       │  │                     │  │
│   │              │  │ /loans       │  │  Recharts BI Charts │  │
│   │              │  │ /transactions│  │  (monthly txn vol,  │  │
│   │              │  │ /feedback    │  │   user growth,      │  │
│   └──────────────┘  └──────────────┘  │   acct distribution)│  │
│                                        └─────────────────────┘  │
│   Axios HTTP Client          useWebSocket() Hook                │
│   (Bearer JWT + auto-refresh interceptor)  (auto-reconnect)     │
└──────────────────────────┬──────────────────────┬──────────────┘
                           │ REST /api/v1          │ WS /ws/{uid}
                           ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│              FastAPI 0.115 (Port 8000, uvicorn)                 │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  /auth   │ │/accounts │ │  /cards  │ │  /analytics      │   │
│  │ signup   │ │ create   │ │ request  │ │  dashboard       │   │
│  │ login    │ │ list/me  │ │ list/me  │ │  monthly-txn     │   │
│  │ refresh  │ │ update   │ │ status   │ │  acct-distrib    │   │
│  │ /me      │ │ delete   │ │          │ │  user-growth     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                                                                 │
│  ┌──────────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │  /transactions   │ │   /loans     │ │   /feedback        │  │
│  │  deposit         │ │   apply      │ │   submit           │  │
│  │  withdraw        │ │   list/me    │ │   list/me          │  │
│  │  history         │ │   status     │ │   list (admin)     │  │
│  │  flagged (admin) │ │   repayment  │ │                    │  │
│  └────────┬─────────┘ └──────────────┘ └────────────────────┘  │
│           │                                                     │
│           ▼  (inline, pre-commit)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │             FRAUD DETECTION ENGINE                      │   │
│  │  Rule 1: amount >= FRAUD_LARGE_TRANSACTION_THRESHOLD    │   │
│  │  Rule 2: Redis velocity counter > MAX_TX / window_secs  │   │
│  │  Rule 3: withdrawal >= 50000 AND amount % 10000 == 0    │   │
│  │  → sets is_flagged=True + fraud_reason on Transaction   │   │
│  └───────────────────────┬─────────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────────┘
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────┐     ┌───────────────────────┐
│  PostgreSQL 16       │     │  Redis 7               │
│  (Port 5432)         │     │  (Port 6379)           │
│                      │     │                        │
│  Tables:             │     │  Keys:                 │
│  ├── users           │     │  ├── fraud:velocity:   │
│  ├── accounts        │     │  │     {account_id}    │
│  ├── transactions    │     │  │     (TTL=300s)       │
│  ├── cards           │     │  └── rate:limit:       │
│  ├── loans           │     │        {user_id}       │
│  └── feedbacks       │     │                        │
│                      │     │  Graceful fallback:    │
│  UUID PKs, indexed   │     │  fraud engine skips    │
│  FKs, CASCADE delete │     │  velocity check if     │
│  async connection    │     │  Redis is unreachable  │
│  pool (size=20,      │     └───────────────────────┘
│  max_overflow=40)    │
└─────────────────────┘
```

---

## Repository Directory Structure

```
avbank/
│
├── docker-compose.yml              # 4-service orchestration: db, redis, backend, frontend
│                                   # Health checks on db (pg_isready) and redis (ping)
│                                   # Named volumes: postgres_data, redis_data
│
├── README.md                       # This file
│
├── backend/
│   ├── Dockerfile                  # Python 3.12-slim base, non-root user, uvicorn entrypoint
│   ├── requirements.txt            # Pinned dependencies: FastAPI 0.115, SQLAlchemy 2.0,
│   │                               # asyncpg 0.29, pydantic 2.9, passlib[bcrypt], jose,
│   │                               # redis 5.1, scikit-learn 1.5, pandas 2.2
│   ├── .env.example                # Environment variable template (never commit .env)
│   │
│   └── app/
│       ├── main.py                 # FastAPI app factory; lifespan handler (DB init + Redis
│       │                           # connect on startup, graceful shutdown); CORS middleware;
│       │                           # all router registrations under /api/v1
│       │
│       ├── core/
│       │   ├── config.py           # Pydantic BaseSettings: reads .env; exposes SECRET_KEY,
│       │   │                       # DATABASE_URL, REDIS_URL, fraud thresholds, CORS origins
│       │   ├── database.py         # Async SQLAlchemy engine (pool_size=20, max_overflow=40,
│       │   │                       # pool_recycle=1800); AsyncSessionLocal; Base declarative;
│       │   │                       # get_db() dependency with commit/rollback/close lifecycle
│       │   ├── redis_client.py     # Singleton async Redis connection; get_redis() /
│       │   │                       # close_redis() lifecycle helpers
│       │   └── security.py         # bcrypt pwd_context (hash + verify); create_access_token
│       │                           # (HS256, 30 min); create_refresh_token (7 days); decode_token
│       │
│       ├── api/
│       │   ├── deps.py             # FastAPI dependency injectors: CurrentUser (JWT decode →
│       │   │                       # DB user lookup), CurrentAdmin (role guard), DBSession
│       │   │                       # (AsyncSession), RedisClient (optional redis.Redis)
│       │   └── v1/
│       │       ├── auth.py         # POST /auth/signup, POST /auth/login, POST /auth/refresh,
│       │       │                   # GET /auth/me, POST /auth/change-password
│       │       ├── accounts.py     # POST /accounts, GET /accounts/me, GET /accounts (admin),
│       │       │                   # GET /accounts/{num}, PATCH /accounts/{num},
│       │       │                   # DELETE /accounts/{num}; minor/joint account logic
│       │       ├── transactions.py # POST /transactions/deposit, POST /transactions/withdraw
│       │       │                   # (both call check_fraud() inline before ledger commit),
│       │       │                   # GET /transactions/account/{num}?limit&offset,
│       │       │                   # GET /transactions/flagged (admin only)
│       │       ├── cards.py        # POST /cards/request, GET /cards/me,
│       │       │                   # PATCH /cards/{num}/status, GET /cards/{num}/transactions
│       │       ├── loans.py        # POST /loans/apply (EMI + total_repayment computed server-side),
│       │       │                   # GET /loans/me, GET /loans (admin),
│       │       │                   # PATCH /loans/{id}/status (admin approval/rejection),
│       │       │                   # GET /loans/{id}/repayment-schedule (full amortization table)
│       │       ├── feedback.py     # POST /feedback, GET /feedback/me, GET /feedback (admin)
│       │       ├── analytics.py    # GET /analytics/dashboard (KPI summary),
│       │       │                   # GET /analytics/transactions/monthly,
│       │       │                   # GET /analytics/accounts/distribution,
│       │       │                   # GET /analytics/users/growth
│       │       └── websocket.py    # WS /ws/{user_id}; ConnectionManager (per-user connection
│       │                           # map); send_to_user(); broadcast(); ping/pong keepalive
│       │
│       ├── models/                 # SQLAlchemy 2.0 ORM models (Mapped[] typed columns)
│       │   ├── user.py             # users — UUID PK, username/email unique, bcrypt hash,
│       │   │                       # UserRole enum (admin|customer), is_active, timestamps
│       │   ├── account.py          # accounts — UUID PK, account_number unique, FK→users,
│       │   │                       # AccountType enum (Savings|Current), total_balance float,
│       │   │                       # joint_account_holder fields, is_active, dob, branch
│       │   ├── transaction.py      # transactions — UUID PK, FK→accounts, TransactionType enum,
│       │   │                       # amount, balance_after, PaymentMethod enum, is_flagged bool,
│       │   │                       # fraud_reason text, created_at
│       │   ├── card.py             # cards — UUID PK, FK→users, card_number unique,
│       │   │                       # card_type, status state machine, expiry
│       │   ├── loan.py             # loans — UUID PK, FK→users, LoanType enum
│       │   │                       # (Personal|Home|Car|Education|Business), LoanStatus enum
│       │   │                       # (Pending|Approved|Rejected|Closed), loan_amount,
│       │   │                       # interest_rate, monthly_emi, total_repayment
│       │   └── feedback.py         # feedbacks — UUID PK, FK→users, rating int, message text
│       │
│       ├── schemas/                # Pydantic v2 request/response schemas
│       │   ├── user.py             # UserCreate, UserLogin, Token, TokenRefresh, UserResponse,
│       │   │                       # ChangePassword
│       │   ├── account.py          # AccountCreate, AccountUpdate, AccountResponse
│       │   ├── transaction.py      # DepositRequest, WithdrawalRequest, TransactionResponse
│       │   ├── card.py             # CardRequest, CardStatusUpdate, CardResponse
│       │   ├── loan.py             # LoanApplication, LoanStatusUpdate, LoanResponse,
│       │   │                       # RepaymentScheduleItem
│       │   └── feedback.py         # FeedbackCreate, FeedbackResponse
│       │
│       └── services/
│           ├── fraud_detection.py  # check_fraud(account_id, amount, type, redis):
│           │                       # Rule 1 threshold, Rule 2 Redis velocity, Rule 3 round-sum;
│           │                       # returns (is_flagged: bool, reason: str)
│           └── analytics.py        # get_monthly_transactions(), get_account_distribution(),
│                                   # get_user_growth(), get_dashboard_summary() — all raw SQL
│                                   # aggregations via SQLAlchemy text() on AsyncSession
│
└── frontend/
    ├── Dockerfile                  # Node 20-alpine, npm ci, next build, next start
    ├── package.json                # Next.js 14.2.15, React 18, Tailwind 3.4, Recharts 2.13,
    │                               # Radix UI primitives, react-hook-form + zod, axios 1.7,
    │                               # js-cookie, lucide-react, react-hot-toast
    ├── next.config.ts              # Next.js config (API rewrites if needed)
    ├── tailwind.config.ts          # Custom design tokens, animation utilities
    ├── tsconfig.json               # Strict TypeScript, path alias @/ → ./
    ├── postcss.config.js           # Tailwind + autoprefixer
    ├── .env.local.example          # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
    │
    ├── app/                        # Next.js 14 App Router
    │   ├── layout.tsx              # Root layout: Toaster (react-hot-toast), global font
    │   ├── globals.css             # Tailwind base, custom card/btn/badge utility classes
    │   ├── page.tsx                # Landing page (redirect to /login or /dashboard)
    │   ├── login/
    │   │   └── page.tsx            # Login form (react-hook-form + zod), useAuth().login()
    │   ├── signup/
    │   │   └── page.tsx            # Registration form, useAuth().signup()
    │   ├── dashboard/
    │   │   ├── page.tsx            # Customer overview: StatCards (balance, acct count,
    │   │   │                       # deposits, withdrawals), account list, last 5 transactions
    │   │   ├── accounts/page.tsx   # Account creation (KYC fields, joint/minor toggle),
    │   │   │                       # account list with balance, deactivate/delete
    │   │   ├── transactions/       # Deposit/withdraw forms, paginated transaction history,
    │   │   │   └── page.tsx        # flagged badge display
    │   │   ├── cards/page.tsx      # Card request form, card list, active/inactive toggle
    │   │   ├── loans/page.tsx      # Loan application (type, amount, duration),
    │   │   │                       # loan list with EMI + status, repayment schedule modal
    │   │   └── feedback/page.tsx   # Star-rating feedback submission, submitted feedback list
    │   └── admin/
    │       ├── dashboard/page.tsx  # KPI stat cards + Recharts: monthly transaction bar chart,
    │       │                       # account distribution pie, user growth line chart
    │       └── loans/page.tsx      # All pending loans table, approve/reject with reason modal
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.tsx         # Role-aware nav (customer vs admin links), logout handler
    │   │   └── DashboardLayout.tsx # Sidebar + main content wrapper, useWebSocket() init
    │   └── ui/
    │       └── StatCard.tsx        # Animated KPI card with icon, value, color variant,
    │                               # skeleton loading state
    │
    ├── hooks/
    │   ├── useAuth.ts              # login(), signup(), logout() with toast feedback;
    │   │                           # role-based redirect after login; stored user state
    │   └── useWebSocket.ts         # WS connect on mount, typed message handler
    │                               # (transaction / fraud_alert / loan_update),
    │                               # 5-second auto-reconnect on close
    │
    └── lib/
        ├── api.ts                  # Axios instance (baseURL /api/v1, 15s timeout);
        │                           # request interceptor attaches Bearer JWT from cookie;
        │                           # response interceptor handles 401 → silent token refresh;
        │                           # typed API modules: authApi, accountApi, transactionApi,
        │                           # cardApi, loanApi, feedbackApi, analyticsApi
        ├── auth.ts                 # storeAuth() (cookies + localStorage), clearAuth(),
        │                           # getStoredUser(), isAuthenticated()
        └── utils.ts                # formatCurrency(), formatDateTime(), cn() (clsx + tw-merge)
```

---

## Security, Key Management & Resilience

### Authentication & Authorization

- **Password storage** — All passwords are hashed with bcrypt (cost factor 12) via `passlib`. Plaintext passwords are never stored or logged.
- **JWT tokens** — Access tokens are signed with HS256 using a configurable `SECRET_KEY` (minimum 32 characters enforced by documentation). Access tokens expire in 30 minutes. Refresh tokens expire in 7 days and are rotated on every use — a consumed refresh token cannot be reused.
- **RBAC** — The `CurrentUser` dependency decodes the JWT and loads the live database record on every request. `CurrentAdmin` adds a role assertion that returns HTTP 403 for non-admin callers. Role checks happen at the dependency injection layer, not inside route logic, so they cannot be accidentally bypassed.
- **CORS** — `BACKEND_CORS_ORIGINS` is an explicit allowlist configured via environment variable. The default development value allows only `localhost:3000`.

### Secret Management & Environment Isolation

- **`.env` is never committed.** The repository ships only `.env.example` with placeholder values.
- **Server-side secrets** — `SECRET_KEY`, `DATABASE_URL`, and `REDIS_URL` exist only in backend environment variables. The Next.js frontend receives only `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` — no secrets are exposed to the browser bundle.
- **Docker Compose** — The `SECRET_KEY` in `docker-compose.yml` defaults to a clearly-labelled placeholder (`super-secret-change-in-production-at-least-32-chars`) that must be overridden via a `.env` file or CI/CD secret injection before any real deployment.
- **Cookie flags** — Auth tokens stored in browser cookies use `sameSite: lax`. For production deployments, the `secure: true` flag should be enabled to restrict transmission to HTTPS only.

### Fraud Detection & Resilience

| Mechanism | Implementation |
|---|---|
| High-value transaction flag | `amount >= FRAUD_LARGE_TRANSACTION_THRESHOLD` (default ₹1,00,000); configurable via env |
| Velocity anomaly detection | Redis `INCR` + `EXPIRE` per account; flags if count exceeds `FRAUD_VELOCITY_MAX_TRANSACTIONS` (default 10) within `FRAUD_VELOCITY_WINDOW_SECONDS` (default 300s) |
| Round-sum cash withdrawal | Flags withdrawals ≥ ₹50,000 where `amount % 10000 == 0` |
| Redis unavailability | Velocity check is wrapped in a `try/except`; if Redis is unreachable, Rule 2 is silently skipped and rules 1 and 3 still execute — the transaction engine never fails due to cache unavailability |
| Database connection failure | SQLAlchemy async engine has `pool_timeout=30` and `pool_recycle=1800`; failed sessions are rolled back via the `get_db()` context manager exception handler |
| Redis startup failure | Caught in the FastAPI `lifespan` handler; logged as a warning, does not halt the API process |
| WebSocket disconnection | Client-side `useWebSocket` hook retries connection every 5 seconds on `ws.onclose`; server-side `ConnectionManager` silently removes stale connections |

---

## Quick Start & Deployment Guide

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose v2)
- Or: Python 3.12+, Node.js 20+, a running PostgreSQL 16 instance, a running Redis 7 instance

---

### Option 1: One-Command Docker Setup (Recommended)

This starts all four services (PostgreSQL, Redis, FastAPI backend, Next.js frontend) with health checks and automatic table creation.

```bash
# 1. Clone the repository
git clone https://github.com/your-org/avbank.git
cd avbank

# 2. (Optional but recommended) Create a .env file to override the default SECRET_KEY
echo "SECRET_KEY=$(openssl rand -hex 32)" > .env

# 3. Build and start all containers
docker compose up --build

# 4. Services are now running:
#    Frontend UI:         http://localhost:3000
#    Backend API + Docs:  http://localhost:8000/docs
#    PostgreSQL:          localhost:5432  (db: avbank, user: avbank_user)
#    Redis:               localhost:6379
```

To run in detached mode:

```bash
docker compose up --build -d
docker compose logs -f backend   # tail backend logs
docker compose logs -f frontend  # tail frontend logs
```

To stop and remove containers (volumes are preserved):

```bash
docker compose down
```

To wipe all data and start fresh:

```bash
docker compose down -v
```

---

### Option 2: Local Development Setup

#### Step 1 — Start Infrastructure

```bash
# PostgreSQL (adjust credentials to match .env)
docker run -d \
  --name avbank_db \
  -e POSTGRES_DB=avbank \
  -e POSTGRES_USER=avbank_user \
  -e POSTGRES_PASSWORD=avbank_pass \
  -p 5432:5432 \
  postgres:16-alpine

# Redis
docker run -d \
  --name avbank_redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### Step 2 — Backend

```bash
cd avbank/backend

# Create and activate a virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

# Install pinned dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env — set SECRET_KEY to a random 32-byte hex string:
#   SECRET_KEY=<output of: openssl rand -hex 32>
#   DATABASE_URL=postgresql+asyncpg://avbank_user:avbank_pass@localhost:5432/avbank
#   REDIS_URL=redis://localhost:6379

# Start the API server (tables are auto-created on first boot via lifespan handler)
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

#### Step 3 — Frontend

```bash
cd avbank/frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# .env.local contents:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Start the development server
npm run dev
```

Frontend available at `http://localhost:3000`.

#### Step 4 — Create an Admin User

After the backend is running, register a user through the UI or API, then manually promote them to admin via psql:

```bash
docker exec -it avbank_db psql -U avbank_user -d avbank \
  -c "UPDATE users SET role = 'admin' WHERE username = 'your_username';"
```

---

## Automated Testing & Verification

The backend ships with `pytest` + `httpx` (async HTTP client). The test suite covers authentication flows, CRUD operations, fraud detection rule evaluation, and the EMI calculation engine.

```bash
cd avbank/backend

# Activate virtual environment (if not already active)
.\venv\Scripts\Activate.ps1   # Windows
source venv/bin/activate       # macOS / Linux

# Run the full test suite
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=term-missing -v

# Run a specific test module
pytest tests/test_auth.py -v
pytest tests/test_transactions.py -v
pytest tests/test_fraud_detection.py -v
pytest tests/test_loans.py -v
```

### Core Test Cases

| Test Module | Test Case | Assertion |
|---|---|---|
| `test_auth.py` | `test_signup_success` | POST /auth/signup returns 201 with UserResponse |
| `test_auth.py` | `test_signup_duplicate_username` | Returns 400 with "Username already registered" |
| `test_auth.py` | `test_login_success` | POST /auth/login returns access_token + refresh_token |
| `test_auth.py` | `test_login_wrong_password` | Returns 401 Unauthorized |
| `test_auth.py` | `test_token_refresh` | POST /auth/refresh with valid refresh token returns new token pair |
| `test_auth.py` | `test_change_password` | POST /auth/change-password with correct current password succeeds |
| `test_accounts.py` | `test_create_account` | POST /accounts returns account_number and initial balance of 0 |
| `test_accounts.py` | `test_customer_cannot_access_other_account` | Returns 403 Forbidden |
| `test_transactions.py` | `test_deposit_updates_balance` | Balance after deposit == balance before + amount |
| `test_transactions.py` | `test_withdrawal_insufficient_funds` | Returns 400 "Insufficient balance" |
| `test_transactions.py` | `test_withdrawal_updates_balance` | Balance after withdrawal == balance before - amount |
| `test_fraud_detection.py` | `test_large_transaction_flagged` | Amount >= 100000 sets is_flagged=True |
| `test_fraud_detection.py` | `test_normal_transaction_not_flagged` | Amount < threshold, low velocity → is_flagged=False |
| `test_fraud_detection.py` | `test_round_sum_withdrawal_flagged` | Withdrawal of 50000.0 (% 10000 == 0) is flagged |
| `test_fraud_detection.py` | `test_redis_unavailable_fallback` | Velocity rule skipped gracefully when Redis is None |
| `test_loans.py` | `test_loan_emi_calculation` | EMI for ₹1,00,000 @ 12% over 12 months ≈ ₹8,884.88 |
| `test_loans.py` | `test_loan_repayment_schedule_length` | Schedule for 12-month loan returns exactly 12 items |
| `test_loans.py` | `test_admin_loan_approval` | PATCH /loans/{id}/status sets status to "Approved" |
| `test_analytics.py` | `test_dashboard_summary_keys` | GET /analytics/dashboard returns all 6 expected KPI keys |

---

## Submission & Compliance Checklist

- [x] **Source code** — Complete full-stack source in `/backend` (Python/FastAPI) and `/frontend` (Next.js 14/TypeScript); no build artifacts committed
- [x] **Containerization** — `docker-compose.yml` orchestrates all four services (PostgreSQL 16, Redis 7, FastAPI, Next.js) with health checks and named volume persistence; single `docker compose up --build` command launches the entire stack
- [x] **REST API standard** — All endpoints follow RESTful conventions under versioned prefix `/api/v1`; responses use standard HTTP status codes; errors return structured JSON with `detail` field
- [x] **Authentication & security** — bcrypt password hashing, HS256 JWT access/refresh tokens, RBAC with admin/customer roles, CORS origin allowlist, no secrets in client bundle
- [x] **Fraud detection sub-system** — Rule-based engine (velocity, threshold, pattern) evaluated inline on every transaction with `is_flagged` and `fraud_reason` audit columns persisted to the ledger
- [x] **Real-time capability** — WebSocket endpoint `/ws/{user_id}` with per-user `ConnectionManager`; client `useWebSocket` hook with typed event handling and auto-reconnect
- [x] **Loan underwriting engine** — EMI calculation using annuity formula, loan-type-specific interest rate table, full month-by-month amortization schedule generation
- [x] **Business intelligence** — Four analytics endpoints with SQL aggregations; Recharts bar, line, and pie visualisations in the admin dashboard
- [x] **Async architecture** — End-to-end async I/O: FastAPI + asyncpg + SQLAlchemy 2.0 AsyncSession + async Redis client; connection pool (pool_size=20, max_overflow=40)
- [x] **Resilience & graceful degradation** — Redis startup failure handled in lifespan; velocity check skipped (not crashed) when Redis is unavailable at runtime; DB sessions always rolled back on exception
- [x] **Frontend completeness** — All seven user-facing modules (dashboard, accounts, transactions, cards, loans, feedback) and two admin modules (dashboard, loans) implemented with loading states, error toasts, and empty states
- [x] **Environment configuration** — `.env.example` and `.env.local.example` provided; `.env` files excluded from version control
- [x] **Health endpoint** — `GET /health` returns service name, version, and status — suitable for container health probes and uptime monitoring
- [x] **Automated tests** — `pytest` test suite covering auth flows, CRUD operations, fraud detection rules, EMI calculation, and admin workflows; `httpx` async test client configured

---

## Modernization Reference

| Dimension | Legacy (`AVBANK FINAL.py`) | AVBank v2.0.0 |
|---|---|---|
| User Interface | Terminal / CLI text input loop | Next.js 14 App Router + Tailwind CSS + Lucide Icons + Recharts |
| API Layer | Synchronous PyMySQL in functions | Async FastAPI + asyncpg connection pooling + Pydantic v2 schemas |
| Database | Raw MySQL queries with f-strings | PostgreSQL 16 + SQLAlchemy 2.0 async ORM |
| Concurrency & Cache | Single-threaded, sequential, blocking | Redis 7 distributed cache, rate limiting, fraud velocity tracking |
| Security & Auth | Plaintext passwords in DB | bcrypt hashing + JWT access/refresh tokens + RBAC |
| Cards Module | Basic terminal creation | Card lifecycle state machine (active, inactive, blocked) with masked card numbers |
| Real-time Comms | None | WebSocket server-push for transaction alerts and fraud triggers |
| Business Intelligence | Local Matplotlib popup window | Interactive Recharts dashboard (monthly volume, portfolio, growth) |
| Deployment | Local Python script execution | Docker Compose 4-container orchestration with health checks |
| Connection Management | New connection per query | Async connection pool (pool_size=20, max_overflow=40, recycle=1800s) |
| Error Handling | `print()` statements | HTTP status codes + structured JSON error responses + DB rollback |
