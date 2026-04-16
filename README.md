# Polokaz

> An invite-only lifestyle platform for exclusive deals, events, and experiences.

Polokaz is a modern full-stack application built with TypeScript, featuring a referral-based membership system that connects people, places, and moments through curated experiences and rewards.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-green.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

## Features

- **Invite-Only Access** - Exclusive membership through referral links
- **Referral System** - Create and manage referral links with expiration and usage limits
- **Secure Authentication** - Email/password authentication with Better Auth
- **User Management** - Role-based access control (admin/user)
- **Subscription Tiers** - Multiple membership levels with exclusive perks
- **Modern UI** - Beautiful, responsive design with Tailwind CSS and Shadcn UI
- **Real-time Updates** - Fast, optimized performance with Next.js App Router

## Architecture

This is a **monorepo** managed by Turborepo, containing:

```
polokaz/
├── apps/
│   ├── web/          # Next.js frontend (Port 3000)
│   └── api/          # Express backend (Port 3001)
└── packages/
    ├── auth/         # Better Auth configuration
    ├── db/           # Drizzle ORM & database schema
    ├── errors/       # Custom error classes
    ├── eslint-config/
    └── tsconfig/
```

## Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Component library
- **Framer Motion** - Animations
- **React Hook Form + Zod** - Form validation

### Backend

- **Express.js 5** - Web server
- **Better Auth** - Authentication
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Zod** - Schema validation
- **LogTape** - Structured logging

### DevOps

- **Turborepo** - Monorepo build system
- **pnpm** - Package manager
- **Supabase** - Hosted PostgreSQL
- **TypeScript** - End-to-end type safety

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18 (LTS recommended)
- **pnpm** 9.0.0 or higher
- **PostgreSQL** database (local or Supabase)
- **Git** for version control

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd polokaz
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create environment files with your configuration:

**Root `.env`:**

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
DATABASE_URL=postgresql://user:password@host:port/database
BETTER_AUTH_SECRET=your-secret-key-here
PORT=3001
```

**`apps/web/.env.local`:**

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
DATABASE_URL=postgresql://user:password@host:port/database
BETTER_AUTH_SECRET=your-secret-key-here
```

**`apps/api/.env`:**

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
DATABASE_URL=postgresql://user:password@host:port/database
BETTER_AUTH_SECRET=your-secret-key-here
PORT=3001
```

**`packages/db/.env`:**

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

> **Generate a secure secret:**
>
> ```bash
> # Linux/Mac
> openssl rand -base64 32
>
> # Windows PowerShell
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
> ```

### 4. Set Up Database

#### Option A: Using Supabase (Recommended)

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get connection string from Settings → Database
4. Update `DATABASE_URL` in all `.env` files

#### Option B: Using Docker

```bash
docker run --name polokaz-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=polokaz \
  -p 5432:5432 \
  -d postgres:15
```

Then use: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polokaz`

### 5. Run Database Migrations

```bash
pnpm --filter @polokaz/db db:push
```

### 6. Seed the Database

```bash
pnpm db:seed
```

This creates an admin user:

- **Email:** `polokaz@polokaz.com`
- **Password:** `polokaz`

### 7. Start Development Servers

```bash
pnpm dev
```

This starts:

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

## Usage

### Access the Application

1. Open http://localhost:3000
2. Sign in with admin credentials
3. Create a referral link from the dashboard
4. Share the referral link to invite new users

### Create Referral Links

1. Log in as admin
2. Click "Invite friends"
3. Set expiration time and max uses
4. Copy and share the generated link

### Sign Up Flow

1. User receives referral link
2. Clicks link and lands on welcome page
3. Completes registration form
4. System validates referral code
5. Account created and user logged in

## Project Structure

```
polokaz/
├── apps/
│   ├── api/                    # Express API
│   │   ├── src/
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── services/       # Business logic
│   │   │   ├── validations/    # Zod schemas
│   │   │   └── index.ts        # Server entry
│   │   └── package.json
│   │
│   └── web/                    # Next.js App
│       ├── app/                # App Router
│       │   ├── (app)/         # Authenticated routes
│       │   ├── (auth)/        # Auth routes
│       │   └── admin/         # Admin routes
│       ├── components/         # React components
│       ├── lib/               # Utilities
│       └── package.json
│
├── packages/
│   ├── auth/                   # Authentication
│   │   ├── src/
│   │   │   ├── client.ts      # Client-side auth
│   │   │   ├── server.ts      # Server-side auth
│   │   │   └── utils.ts       # Auth utilities
│   │   └── package.json
│   │
│   ├── db/                     # Database
│   │   ├── src/
│   │   │   ├── schema/        # Drizzle schemas
│   │   │   ├── db.ts          # DB client
│   │   │   └── index.ts       # Exports
│   │   ├── migrations/        # SQL migrations
│   │   ├── drizzle.config.ts  # Drizzle config
│   │   └── package.json
│   │
│   └── errors/                 # Error handling
│       └── src/
│
├── scripts/
│   └── seed.ts                 # Database seeding
│
├── .env                        # Root environment
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # Workspace config
├── turbo.json                  # Turborepo config
└── README.md                   # This file
```

## Available Scripts

### Root Level

```bash
# Development
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all apps
pnpm lint             # Lint all code
pnpm format           # Format code with Prettier
pnpm check-types      # Type check all packages

# Database
pnpm db:seed          # Seed database with admin user
```

### Database Package (`packages/db`)

```bash
pnpm --filter @polokaz/db db:push      # Push schema to database
pnpm --filter @polokaz/db db:generate  # Generate migrations
pnpm --filter @polokaz/db db:migrate   # Run migrations
pnpm --filter @polokaz/db db:studio    # Open Drizzle Studio
```

### Individual Apps

```bash
# Web app only
pnpm --filter web dev

# API only
pnpm --filter @polokaz/api dev
```

## Database Schema

### Core Tables

- **`user`** - User accounts with profile information
- **`account`** - Authentication provider accounts
- **`session`** - Active user sessions
- **`verification`** - Email verification tokens
- **`referral`** - Referral links with expiration and limits
- **`referral_use`** - Tracking of referral usage

### Key Relationships

```
user ──< session
user ──< account
user ──< referral (created by)
user ──< referral_use (used by)
referral ──< referral_use
```

## Authentication

### Features

- Email/password authentication
- Secure session management
- Role-based access control (admin/user)
- Referral code validation
- Additional user fields (birthdate, country)

### Protected Routes

- `/` - Home (requires authentication)
- `/plans` - Subscription plans (requires authentication)
- `/admin/*` - Admin panel (requires admin role)

### Public Routes

- `/sign-in` - Login page
- `/sign-up/*` - Registration flow

## API Endpoints

### Authentication (`/api/auth/*`)

Handled by Better Auth:

- `POST /api/auth/sign-in/email` - Sign in
- `POST /api/auth/sign-up/email` - Sign up
- `GET /api/auth/get-session` - Get current session
- `POST /api/auth/sign-out` - Sign out

### Referrals (`/api/referral`)

- `POST /api/referral` - Create referral link
  ```json
  {
    "expiresAt": 86400000, // milliseconds
    "maxUses": 10 // optional
  }
  ```

## Testing

```bash
# Run tests (when implemented)
pnpm test

# Type checking
pnpm check-types

# Linting
pnpm lint
```

## Deployment

### Frontend (Vercel)

1. Connect repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Backend

1. Create new service
2. Connect repository
3. Set environment variables
4. Deploy from `apps/api`

### Database (Supabase)

Already hosted - just use connection string

## Security

- Password hashing with bcrypt
- HTTP-only secure cookies
- CORS configuration
- SQL injection prevention (parameterized queries)
- Input validation with Zod
- Environment variable protection
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Roadmap

- [ ] Email verification
- [ ] Password reset functionality
- [ ] User dashboard with referral analytics
- [ ] Subscription payment integration
- [ ] Admin analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Social authentication (Google, GitHub)
- [ ] Multi-language support

---


