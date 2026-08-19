# Fidus — Trust-Based Service Matching Framework (Backend)

Fidus is the backend engine for a trust-based service matching framework that connects Clients (who post service requests) with Artisans (who bid and fulfil work). This repository contains the TypeScript/Node.js API, Prisma data models, and Cloudinary integration used by the Fidus backend.

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
Fidus is a backend service for a marketplace that prioritizes trust: users verify identity documents (KYC), gain a trust score (WTA_Score), post service requests, place bids, manage escrow-like transactions, and leave reviews. It’s intended for mobile/web frontends and developer integration.

### Stack
- Language(s): TypeScript (100%)
- Framework / runtime: Node.js (Express 5) + TypeScript, tsx for running TypeScript code directly
- Notable libraries:
  - Prisma (ORM) + Prisma adapter for raw pg pool
  - express (HTTP)
  - cloudinary + multer-storage-cloudinary (file uploads)
  - jsonwebtoken (JWT auth)
  - bcrypt (password hashing)
  - pg (Postgres client)

## Key features
- JWT-based authentication (signup / login)
- Role separation: Client vs Artisan
- Service request lifecycle (create, list open requests, client’s requests)
- Bids, escrow-like transactions and reviews modeled in Prisma
- KYC document uploads (NIN, profile picture, business certificate) stored via Cloudinary
- Trust score (WTA_Score) updates based on verification actions
- Health-check endpoint to confirm DB connectivity

## How it's organized
Top-level (relevant):
```
.
├── .gitignore
├── README.md
└── fidus-backend/
    ├── package.json
    ├── prisma/
    │   └── schema.prisma         # data models (Users, Service_Requests, Bids, Reviews, KycSubmission, etc.)
    └── src/
        ├── index.ts              # app entrypoint (express server)
        ├── routes/
        │   ├── auth.ts          # signup / login
        │   ├── kyc.ts           # KYC upload and status
        │   └── services.ts      # service request endpoints
        └── middleware/
            ├── auth.ts          # JWT validation middleware
            └── upload.ts        # Cloudinary + multer storage
```

## How it fits together
index.ts boots an Express server, wires middleware and routes, and uses Prisma (configured with a raw pg Pool adapter) to interact with PostgreSQL. Routes enforce role-based behavior: Clients create requests, Artisans view open requests and place bids (bidding logic is modeled in Prisma schema; routes can be extended to support bid placement). File uploads go through the upload middleware which stores assets on Cloudinary and saves URLs in the KycSubmission model.

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
Create a .env file with the following variables (examples):

- DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
- PORT=5000
- JWT_SECRET="a_long_random_secret"         # sign JWTs with this
- CLOUDINARY_CLOUD_NAME="your_cloud_name"
- CLOUDINARY_API_KEY="your_api_key"
- CLOUDINARY_API_SECRET="your_api_secret"

Notes:
- DATABASE_URL must be a valid postgres URI.
- JWT_SECRET should be strong and stored securely in production (use a secret manager).

## Database & Prisma
Schema lives at `fidus-backend/prisma/schema.prisma`. Models include:
- Users (uuid, FullName, Email, Role, PasswordHash, KYC_Verified, WTA_Score)
- Service_Requests (RequestID, ClientID, Description, LocationCoordinates, PriceRange, Status)
- Bids, Escrow_Transactions, Reviews
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

(If you add build/run scripts for production, standard steps would be: `npm run build` → transpile → `node dist/index.js` or use a process manager like PM2 / Docker.)

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
  - Returns access-confirmation and decoded user
- POST /api/kyc/upload-nin
  - Multipart form: field `nin_document` (image)
  - Uploads NIN; upserts KYC record; sets user KYC_Verified = true and WTA_Score = 100.0
- POST /api/kyc/upload-profile-pic
  - Multipart form: field `profile_picture`
  - Uploads profile picture and increments WTA_Score by 10
- POST /api/kyc/upload-business-cert
  - Multipart form: field `business_certificate`
  - Uploads document and increments WTA_Score by 20

Services
- POST /api/services/create
  - Body: { Description, LocationCoordinates, PriceRange }
  - Only role "Client" allowed; creates a service request
- GET /api/services/open
  - Returns all open service requests (role "Artisan" only)
- GET /api/services/my-requests
  - Returns client's posted requests (role "Client" only)

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
- Upload middleware uses `multer` + `multer-storage-cloudinary`. Files are uploaded to Cloudinary and the returned `path` (secure URL) is saved in the `KycSubmission` model.
- Allowed formats: jpg, jpeg, png (per current storage config)
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
- Prisma uses `@prisma/adapter-pg` with a provided pg Pool; inspect `src/index.ts` and route files for how the pool and adapter are configured.
- The code uses explicit field names that match Prisma models (e.g., `users`, `service_Requests`, `kycSubmission`). Use `npx prisma studio` while developing to inspect records.

## Testing & linting
- There are no test or lint scripts in package.json yet. Recommended additions:
  - Jest / Vitest for unit tests
  - ESLint + Prettier for code style
  - Add CI workflow (GitHub Actions) to run tests and lint on PRs

## Security & production notes
- Keep JWT_SECRET and Cloudinary secrets out of source control. Use environment secrets in production.
- Use HTTPS / TLS for production traffic.
- Consider rate-limiting and validation libraries (e.g., celebrate / Joi or zod) for stricter request validation.
- File upload limits: currently allowed image types and Cloudinary transformations are configured — consider size limits and virus scanning for production.

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
