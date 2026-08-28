# Fidus — Trust-Based Service Matching Framework (Backend)

Fidus is the backend engine for a trust-based service matching framework that connects Clients (who post service requests) with Artisans (who bid and fulfil work). This repository contains the TypeScript backend that implements authentication, KYC, bidding, escrow-like flow, reviews, and a trust score (WTA) engine.

## Table of contents
- [What this is](#what-this-is)
- [Stack](#stack)
- [Key features](#key-features)
- [How it's organized](#how-its-organized)
- [How it fits together](#how-it-fits-together)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database & Prisma](#database--prisma)
- [Running the project](#running-the-project)
- [API reference (quick)](#api-reference-quick)
- [Authentication](#authentication)
- [File uploads / KYC](#file-uploads--kyc)
- [Development tips](#development-tips)
- [Testing & linting](#testing--linting)
- [Security & production notes](#security--production-notes)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## What this is
Fidus is a backend service for a marketplace that prioritizes trust: users verify identity documents (KYC), gain a trust score (WTA_Score), post service requests, place bids, manage escrow-like transactions, and review completed work. The codebase is TypeScript-first and organized to separate HTTP controllers, business services, and validation.

### Stack
- Language(s): TypeScript (100%)
- Framework / runtime: Node.js (Express 5) + TypeScript, tsx for running TypeScript code directly
- Notable libraries:
  - Prisma (ORM) + Prisma adapter for raw pg pool
  - express (HTTP)
  - cloudinary + multer (file uploads)
  - jsonwebtoken (JWT auth)
  - bcrypt (password hashing)
  - zod (request validation)
  - axios (external HTTP e.g., Paystack verification)
  - eslint + @typescript-eslint (linting)

## Key features
- JWT-based authentication (signup / login)
- Role separation: Client vs Artisan
- Service request lifecycle (create, list open requests, client’s requests)
- Bids, escrow-like transactions and reviews modeled in Prisma
- KYC document uploads (NIN, profile picture, business certificate) stored via Cloudinary
- Trust score (WTA_Score) updates based on verification actions and reviews
- Health-check endpoint to confirm DB connectivity

## How it's organized
Top-level (relevant):

```
.
├── .gitignore
├── README.md
└── fidus-backend/
    ├── package.json
    ├── package-lock.json
    ├── eslint.config.ts            # ESLint configuration
    ├── prisma/
    │   ├── schema.prisma          # data models (Users, Service_Requests, Bids, Reviews, KycSubmission, etc.)
    │   └── migrations/            # Prisma migrations (including escrow decimal migration)
    ├── src/
    │   ├── index.ts               # app entrypoint (express server)
    │   ├── prisma.ts              # centralized Prisma client (pg Pool adapter)
    │   ├── controllers/           # HTTP controllers (thin, call services)
    │   │   ├── authController.ts
    │   │   ├── serviceController.ts
    │   │   ├── bidController.ts
    │   │   ├── escrowController.ts
    │   │   ├── kycController.ts
    │   │   └── reviewController.ts
    │   ├── services/              # Business logic (transactional, DB access)
    │   ├── routes/                # Express routes glue (use controllers + validators)
    │   ├── middleware/            # auth, upload helpers, validation middleware
    │   ├── validators/            # Zod schemas for request validation
    │   └── utils/                 # misc helpers (if any)
    └── prisma/                    # schema + migrations
```

Notes:
- Logic is split into controllers (HTTP layer) and services (business layer) so unit-testing and reuse are easier.
- Prisma client is centralized at `src/prisma.ts` (uses a pg Pool + PrismaPg adapter) and imported by services.

## How it fits together
`index.ts` boots an Express server, wires middleware and routes, and uses Prisma to interact with PostgreSQL. Routes enforce role-based behavior: Clients create requests, Artisans view open requests and place bids. Services contain transactional logic (Prisma transactions) for operations that touch multiple tables (bid acceptance, escrow creation/release, completion handshake).

## Getting started (shortest path)
Prerequisites:
- Node.js (recommended v18+)
- PostgreSQL instance
- Cloudinary account (for file uploads)
- Git

Clone and install:
```bash
git clone https://github.com/Abdul-Samod/Final-Year-Project-Backend.git
cd Final-Year-Project-Backend/fidus-backend
npm install
```

Create environment file:
```bash
cp .env.example .env
# edit .env with your values (see section below)
```

Set up Prisma & database (local development):
```bash
# generate client
npx prisma generate

# create/migrate schema (adjust command to your migration strategy)
npx prisma migrate dev --name init
```

Run dev server:
```bash
npm run dev
# package.json's dev script: nodemon --watch src --ext ts --exec tsx src/index.ts
```

The API will be available at http://localhost:5000 by default.

## Environment variables
Create a `.env` file with the following variables (examples):

- DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
- PORT=5000
- JWT_SECRET="a_long_random_secret"         # sign JWTs with this
- CLOUDINARY_CLOUD_NAME="your_cloud_name"
- CLOUDINARY_API_KEY="your_api_key"
- CLOUDINARY_API_SECRET="your_api_secret"
- PAYSTACK_SECRET_KEY="your_paystack_secret_key"  # required for escrow verification with Paystack (used in test/production modes)
- NODE_ENV=development

Notes:
- DATABASE_URL must be a valid postgres URI.
- JWT_SECRET should be strong and stored securely in production (use a secret manager).
- PAYSTACK_SECRET_KEY is required if you plan to use the escrow verification endpoint (POST /api/escrow/verify).

## Database & Prisma
Schema lives at `fidus-backend/prisma/schema.prisma`. Models include:
- Users (uuid, FullName, Email, Role, PasswordHash, KYC_Verified, WTA_Score)
- Service_Requests (RequestID, ClientID, Description, LocationCoordinates, PriceRange, Status)
- Bids, Escrow_Transactions (AmountHeld as Decimal), Reviews
- KycSubmission (stores Cloudinary URLs)

Common Prisma commands:
- `npx prisma generate` — generate client
- `npx prisma migrate dev --name <desc>` — create and apply a migration (dev)
- `npx prisma studio` — web UI to inspect DB

Important: The app constructs a pg Pool and passes it to the PrismaPg adapter before creating a PrismaClient. Ensure your pool connection string is valid and database is reachable.

## Running the project
Development:
```bash
npm run dev
```

(For production, add a build step to compile to `dist/` and run Node on the compiled JS or containerize the app.)

## API reference (quick)
Base path: /api

Auth
- POST /api/auth/signup
  - Body: { fullName, email, role, password }
  - Roles: "Client" or "Artisan"
- POST /api/auth/login
  - Body: { email, password }
  - Returns: JWT token and basic user info

KYC
- GET /api/kyc/status
  - Headers: Authorization: Bearer <token>
- POST /api/kyc/upload-nin
  - Multipart form: field `nin_document` (image)
- POST /api/kyc/upload-profile-pic
  - Multipart form: field `profile_picture`
- POST /api/kyc/upload-business-cert
  - Multipart form: field `business_certificate`

Services
- POST /api/services/create
  - Body: { Description, LocationCoordinates, PriceRange }
  - Only role "Client" allowed; creates a service request
- GET /api/services/open
  - Returns all open service requests (role "Artisan" only)
- GET /api/services/my-requests
  - Returns client's posted requests (role "Client" only)

Bids
- POST /api/bids/create
  - Body: { requestID, proposedPrice, message }
  - Role: Artisan
- GET /api/bids/:jobId
  - Role: Client (only for their job)
- POST /api/bids/decision
  - Body: { bidId, decision: 'Accept' | 'Counter', counterAmount? }
  - Role: Client

Escrow
- POST /api/escrow/verify
  - Body: { reference, requestId, bidId }
  - Verifies payment (Paystack) and creates escrow record

Health
- GET /api/health
  - Pings database and returns status

## Authentication
- JWTs are signed using JWT_SECRET.
- The middleware in `src/middleware/auth.ts` expects an Authorization header: `Bearer <token>`.
- After verification, the decoded payload (uuid and role) is attached to `req.user`.

Example: login → receive token → call protected route:
```bash
# login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret"}'

# call protected route
curl http://localhost:5000/api/kyc/status \
  -H "Authorization: Bearer <token>"
```

## File uploads / KYC (Cloudinary)
- Upload middleware uses `multer` (memory storage) and streams buffers to Cloudinary via the helper `uploadToCloudinary`.
- Allowed formats: jpg, jpeg, png
- File size limit: 5MB (configured in middleware)
- Fields used by routes:
  - `nin_document` for NIN upload
  - `profile_picture` for profile picture
  - `business_certificate` for business cert

Example curl file upload:
```bash
curl -X POST http://localhost:5000/api/kyc/upload-nin \
  -H "Authorization: Bearer <token>" \
  -F "nin_document=@/path/to/nin.jpg"
```

## Development tips
- The project runs TypeScript directly using `tsx` for convenience. For production builds, add a `build` script to compile to `dist/` and run Node on the compiled JS.
- Request validation is implemented with Zod (see `src/validators`).
- ESLint + @typescript-eslint are included; run the linter locally during development.
- Centralize DB access in `src/prisma.ts`; services should import that client instead of creating new PrismaClients.

## Testing & linting
- The repository currently includes ESLint config. Recommended additions:
  - Jest / Vitest for unit tests
  - Prettier for consistent formatting
  - Add CI workflow (GitHub Actions) to run tests and lint on PRs

## Security & production notes
- Keep JWT_SECRET, PAYSTACK_SECRET_KEY and Cloudinary secrets out of source control. Use environment secrets in production.
- Use HTTPS / TLS for production traffic.
- Consider rate-limiting and strict request validation for public endpoints.
- Ensure you back up your database prior to applying Prisma migrations that alter column types (e.g., escrow AmountHeld → DECIMAL).

## Contributing
- Open an issue to discuss major changes.
- Follow the repository's coding conventions; add tests for new features.
- Suggested workflow:
  1. Fork the repository
  2. Create a feature branch (feature/your-feature)
  3. Open a pull request describing changes and include relevant tests

## License
This project uses the ISC license (see package.json).

## Contact
Maintainer: Abdul-Samod  
Repository: https://github.com/Abdul-Samod/Final-Year-Project-Backend
