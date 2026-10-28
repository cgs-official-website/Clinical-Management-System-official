# clinic OS — Enterprise Clinical Management System (CMS) & Healthcare ERP

[![System Status](https://img.shields.io/badge/System-Operational-emerald?style=flat-square&logo=server)](http://localhost:5000/api/health)
[![Node Runtime](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.87-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015+-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)

---

## 📋 Table of Contents
1. [Executive Overview](#-executive-overview)
2. [Monorepo Architecture](#-monorepo-architecture)
3. [Technology Stack Matrix](#-technology-stack-matrix)
4. [Core Features & Clinical Verticals](#-core-features--clinical-verticals)
   - [Multi-Tenancy & Dynamic RBAC](#1-multi-tenancy--dynamic-zero-hardcoding-rbac)
   - [Specialty Clinical Modules](#2-specialty-clinical-verticals)
   - [Patient Flow & Clinical Triage Kanban](#3-patient-flow--clinical-triage-kanban)
   - [India-Compliant Pharmacy & Inventory](#4-india-compliant-pharmacy--inventory-system)
   - [AI Category & Workflow Generator](#5-ai-subsystem-openrouter-integration)
5. [System Architecture Diagram](#-system-architecture-diagram)
6. [Database Schema & Data Models](#-database-schema--data-models)
7. [API & Real-Time Specifications](#-api--real-time-specifications)
8. [Installation & Quick Start](#-installation--quick-start)
   - [Prerequisites](#prerequisites)
   - [Backend API Setup](#1-backend-api-server)
   - [Frontend Web Application](#2-frontend-web-application-client-website)
   - [Mobile Application (React Native)](#3-mobile-application-client-app)
9. [Pre-Configured Demo Accounts](#-pre-configured-demo-accounts)
10. [Environment Variables Reference](#-environment-variables-reference)
11. [Testing & Verification Suites](#-testing--verification-suites)
12. [Deployment & Production Readiness](#-deployment--production-readiness)

---

## 🏥 Executive Overview

**clinic OS** (also known as *Zuna Health CMS*) is a production-grade, multi-tenant **Clinical Management System & Healthcare Enterprise Resource Planning (ERP)** platform. 

It provides an end-to-end digital operating system for standalone clinics, multi-specialty practices, and multi-branch hospital chains. The system unifies clinical consultations, nurse triage queues, digital prescription management, India regulatory-compliant pharmacy fulfillment (CDSCO schedules, DPCO ceiling prices, GST/HSN), billing, dynamic role-based permissions, and OpenRouter-powered AI clinic automation across **Web** and **Mobile (Android/iOS)**.

---

## 📂 Monorepo Architecture

The workspace is organized into modular tiers separating backend services, web applications, mobile apps, and architectural knowledge:

```
c:\Users\ELCOT\Desktop\clinic/
│
├── server/                     # Backend REST API & Real-time WebSocket Service
│   ├── prisma/                 # Prisma ORM schema (599 lines), seed scripts, migrations
│   ├── scripts/                # Database seeds, role linking & diagnostic verification tools
│   ├── src/
│   │   ├── config/             # Zod environment schema, Prisma client, Redis client + fallback
│   │   ├── constants/          # Demo presets, role catalogs, default permissions
│   │   ├── controllers/        # Express route handlers (Auth, Admin, Superadmin, Clinical, AI, Pharmacy)
│   │   ├── middlewares/        # JWT auth, dynamic RBAC gate, rate limiters, Zod validators, error handler
│   │   ├── routes/             # Express API routing mounts & OpenAPI Swagger docs
│   │   ├── services/           # Domain logic (Clinical, RBAC, Pharmacy, AI, Registration, Superadmin)
│   │   └── utils/              # Structured winston/console logger, custom API errors, OpenAPI spec
│   ├── app.js                  # Express middleware assembly & route registration
│   ├── server.js               # Dual-stack HTTP server & WebSocket real-time server (/ws/updates)
│   └── package.json            # Node.js ESM configuration & dependencies
│
├── client-website/             # Desktop/Web Clinical ERP (React 19 + Vite + Tailwind CSS)
│   ├── public/                 # Favicons, clinical icons, SVG assets
│   ├── src/
│   │   ├── app/                # App entrypoint, routing guards, router configuration
│   │   ├── components/         # Design system (AppShell, Modal, StatCard, Badge, Button, Input)
│   │   ├── features/           # Slices: Admin, Superadmin, Staff, Cardio, Dental, Physio, Auth, Landing
│   │   ├── hooks/              # Custom hooks: useAuth, useRolePermissions, usePermissions
│   │   ├── lib/                # Axios API client, local mock simulator adapter (devApiSimulator)
│   │   └── store/              # Zustand state stores (auth, theme, navigation, permission sync)
│   ├── index.html              # Single Page Application HTML root with modern typography
│   ├── tailwind.config.js      # Tailored clinical color palette & animation keyframes
│   └── vite.config.js          # Vite build & local dev server configuration (Port 5173)
│
├── client-app/                 # Mobile Application (React Native 0.87 + Android/iOS)
│   ├── android/                # Native Android Gradle configuration & manifest
│   ├── ios/                    # Native iOS Xcode workspace & project files
│   ├── assets/                 # Mobile icons, illustrations, Android bundle
│   ├── src/
│   │   ├── api/                # Mobile API clients (admin, auth, client, clinical, specialty)
│   │   ├── components/         # Shared mobile components & modals (BookAppointment, NewPatient, etc.)
│   │   ├── config/             # Environment & networking config (ADB reverse / host mapping)
│   │   ├── constants/          # Demo accounts & color palettes
│   │   ├── hooks/              # Mobile auth & module dynamic permission hooks
│   │   ├── navigation/         # React Navigation (Bottom Tabs + Native Stack + Dynamic Registry)
│   │   └── screens/            # Screen views (Clinical, Admin, Auth, Profile, Specialty: Dental/Cardio/Physio)
│   └── package.json            # React Native dependencies & scripts
│
├── graphify-out/               # Knowledge Graph analysis artifact (AST code relationships & communities)
├── PROJECT_ANALYSIS.md         # In-depth architectural analysis report
└── README.md                   # Complete master project documentation (this file)
```

---

## ⚡ Technology Stack Matrix

| Layer | Technology | Version | Description & Rationale |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | **Node.js** | `>=18.0.0` (ESM) | Native ECMAScript Modules, asynchronous non-blocking event loop |
| **API Framework** | **Express** | `^4.21.2` | Robust REST API router, security middleware, and controller pipeline |
| **Database ORM** | **Prisma** | `^5.22.0` | Type-safe PostgreSQL client, schema migrations, and declarative modeling |
| **Primary Database** | **PostgreSQL** | `15+` | ACID compliant relational storage for clinics, patients, vitals, invoices |
| **Cache & Pub/Sub** | **ioredis** | `^5.4.2` | In-memory permission caching with built-in memory fallback for local dev |
| **Realtime WebSockets**| **ws** | `^8.18.0` | Real-time permissions invalidation push (`/ws/updates`) and alert sync |
| **AI LLM Engine** | **OpenRouter API** | `gemini-2.5-flash` | Automatic specialty module, procedure catalog, and role template generation |
| **Documentation** | **Swagger UI** | `^5.0.1` | Interactive OpenAPI 3.0 visualizer mounted at `/api/docs` |
| **Web Frontend** | **React** | `^19.2.8` | Modern concurrent React UI components |
| **Web Bundler** | **Vite** | `^8.2.2` | Instant HMR, lightning-fast ESM bundling |
| **Web Styling** | **Tailwind CSS** | `^3.4.19` | Custom clinical tokens, glassmorphism, responsive grid layouts |
| **3D Graphics** | **Three.js & R3F** | `^0.186.0` | Interactive 3D DNA helix visualizer on the landing page |
| **Web State** | **Zustand & React Query** | `^5.0` / `^5.102` | Distributed client-side auth state and cached server-side queries |
| **Mobile Runtime** | **React Native** | `0.87.1` | High-performance native mobile apps for clinical staff on the go |
| **Mobile Navigation** | **React Navigation** | `^7.0.14` | Native stack navigation and bottom tabs with role-based routing |

---

## 🌟 Core Features & Clinical Verticals

### 1. Multi-Tenancy & Dynamic (Zero-Hardcoding) RBAC
- **Strict Tenant Data Isolation**: Every clinical record (Patient, Appointment, Prescription, Invoice, Inventory Item) is scoped by `tenantId`.
- **Dynamic Permission Combinatorics**: Permissions are formed dynamically:
  - *Module*: `patients`, `appointments`, `prescriptions`, `billing`, `inventory`, `staff`, `roles`, etc.
  - *Action*: `view`, `create`, `edit`, `delete`, `export`, `approve`.
  - *Wildcard Support*: Sub-tenants and superadmins can assign scoped wildcards (e.g. `patients.*` or `*`).
- **Live WebSocket Synchronization**: When an administrator updates a role's permissions, the backend invalidates the Redis permission cache and broadcasts an event through WebSockets (`ws://localhost:5000/ws/updates`). Connected client apps dynamically update UI capabilities without requiring staff to re-login.

### 2. Specialty Clinical Verticals

```
                     ┌── General Practice (Vitals, Consultations, ICD-10)
                     ├── Dental Care (Interactive 32-Tooth FDI Chart, Treatment Plans)
Specialty Verticals ─┼── Cardiology (ECG Lead Review, Echo Reports, Cath Lab, ASCVD Risk)
                     └── Physiotherapy (Interactive Body Map, ROM, Pain VAS, Exercise Regimens)
```

- **General Medicine**: Comprehensive patient history, medical record numbers (MRN), allergy tags, ICD-10 diagnostic entries, vital sign tracking.
- **Dental Clinic Module**:
  - Interactive two-arch FDI adult & pediatric dental tooth chart.
  - Tooth condition status (Healthy, Decayed, Missing, Filled, Crown, Extraction indicated).
  - Treatment plans, shade matching, orthodontic tracking, implant registry, and dental lab orders.
- **Cardiology Clinic Module**:
  - ECG lead tracing viewer and automated QT/PR measurement recording.
  - Echocardiogram report builder with ejection fraction (EF%) calculation.
  - Cardiac catheterization lab scheduling and ASCVD/Framingham 10-year cardiovascular risk scores.
- **Physiotherapy Clinic Module**:
  - Interactive anatomical body map with joint Range-of-Motion (ROM) angle logging.
  - Visual Analogue Scale (VAS 1–10) pain rating scale with timeline progression.
  - Custom prescribed exercise programs and recovery tracking notes.

### 3. Patient Flow & Clinical Triage Kanban
Tracks a patient's clinic visit through every lifecycle state:
1. **Intake / Front Desk**: Quick registration, ID verification, token assignment.
2. **Triage / Nurse Station**: Recording vitals (Blood Pressure, Heart Rate, SpO2, Temperature, Blood Sugar, BMI) and chief complaints.
3. **Doctor Consultation**: Clinical diagnosis, digital prescription generation, order investigations.
4. **Pharmacy Queue**: Live prescription transmission, drug interaction checks, batch allocation, and dispensing.
5. **Billing & Checkout**: Itemized invoicing, tax compliance, payment collection (Cash, Card, UPI, Insurance), and automated receipt generation.

### 4. India-Compliant Pharmacy & Inventory System
- **CDSCO Drug Classifications**: Enforces mandatory prescription checks for Schedule H, H1, and X controlled medications.
- **DPCO Ceiling Pricing**: Real-time validation against India's Drugs (Prices Control) Order ceiling rates to prevent regulatory overcharging.
- **HSN & GST Accounting**: Automated tax breakdown with 5%, 12%, and 18% GST categories.
- **Batch Expiry Surveillance**: Real-time alerts for drugs reaching expiration within 30, 60, or 90 days with FIFO/FEFO stock depletion.
- **Excel Bulk Import/Export**: Upload bulk inventory through formatted `.xlsx` spreadsheets with automatic schema validation.

### 5. AI Subsystem (OpenRouter Integration)
- **Specialty Category Generator**: Provides automatic creation of clinic categories. Entering a custom specialty (e.g., *"Pediatric Ophthalmology"*) prompts the LLM to generate:
  - Custom patient fields and specialty vitals schemas
  - Default procedure catalogs and pricing guidelines
  - Tailored role templates and permission sets
  - Pharmacy formulary suggestions
- **Clinical Copilot Assistant**: Embedded floating assistant supporting doctor clinical note summarization, drug dosage guidelines, and navigation assistance.

---

## 🏛 System Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients ["Client Platforms"]
        Web["Web Application\n(React 19 + Vite)\nhttp://localhost:5173"]
        Mobile["Mobile App (Android/iOS)\n(React Native 0.87)"]
    end

    subgraph Gateway ["Express 4 API Gateway (Port 5000)"]
        HTTPRouter["REST Router (/api)"]
        WSServer["WebSocket Server (/ws/updates)"]
        Security["Helmet + CORS + Rate Limiters"]
        AuthMiddleware["JWT Authentication & Tenant Scope"]
        RBACGate["Dynamic RBAC Middleware"]
    end

    subgraph Services ["Application Services Layer"]
        AuthSvc["Auth & Tenant Service"]
        ClinicalSvc["Clinical & Triage Service"]
        PharmSvc["Pharmacy & Inventory Service"]
        RBACSvc["Dynamic RBAC Engine"]
        AISvc["OpenRouter AI Engine"]
        SuperadminSvc["Superadmin Platform Service"]
    end

    subgraph Data ["Persistence & Cache Tier"]
        PrismaORM["Prisma ORM 5.22"]
        PostgreSQL[("PostgreSQL 15+\nRelational Storage")]
        RedisCache[("Redis Pub/Sub & In-Memory Fallback")]
        OpenRouterAPI["OpenRouter AI Gateway\n(Gemini 2.5 Flash)"]
    end

    Web & Mobile --> Security --> HTTPRouter --> AuthMiddleware --> RBACGate
    Web & Mobile <--> WSServer
    
    RBACGate --> AuthSvc & ClinicalSvc & PharmSvc & RBACSvc & SuperadminSvc
    AISvc <--> OpenRouterAPI

    WSServer <--> RedisCache
    RBACSvc <--> RedisCache

    AuthSvc & ClinicalSvc & PharmSvc & RBACSvc & SuperadminSvc --> PrismaORM
    PrismaORM --> PostgreSQL
```

---

## 🗄 Database Schema & Data Models

Managed through Prisma (`server/prisma/schema.prisma`), the database consists of **18 primary relational models**:

```mermaid
erDiagram
    TENANT ||--o{ USER : "has staff/admins"
    TENANT ||--o{ PATIENT : "manages"
    TENANT ||--o{ APPOINTMENT : "schedules"
    TENANT ||--o{ INVENTORY_ITEM : "stocks"
    TENANT ||--o{ INVOICE : "bills"
    TENANT ||--o{ AUDIT_LOG : "records"
    
    USER ||--o{ USER_ROLE : "assigned"
    ROLE ||--o{ USER_ROLE : "belongs to"
    ROLE ||--o{ ROLE_PERMISSION : "grants"
    PERMISSION ||--o{ ROLE_PERMISSION : "maps to"
    
    PATIENT ||--o{ APPOINTMENT : "books"
    PATIENT ||--o{ PRESCRIPTION : "receives"
    PATIENT ||--o{ INVOICE : "billed for"
    
    INVENTORY_ITEM ||--o{ STOCK_MOVEMENT : "tracks"
    INVOICE ||--o{ INVOICE_ITEM : "contains"
```

### Core Entities Summary
1. **Tenants (`Tenant`)**: Stores clinic metadata, subdomain, status (`PENDING`, `ACTIVE`, `REJECTED`, `SUSPENDED`), category link, subscription plan.
2. **Users & Auth (`User`, `StaffProfile`, `RefreshToken`)**: Multi-tenant user records with hashed credentials, contact details, assigned department, and rotating tokens.
3. **Dynamic RBAC (`Module`, `Permission`, `Role`, `RolePermission`, `UserRole`, `RoleTemplate`)**: Fine-grained capability definitions.
4. **Clinical Operations (`Patient`, `Appointment`, `Prescription`, `Invoice`, `InvoiceItem`)**: Medical records, vital histories, triage tokens, medicine dosages, payment records.
5. **Pharmacy & Inventory (`InventoryItem`, `StockMovement`)**: Batch numbers, CDSCO schedules, DPCO ceiling prices, GST/HSN codes, quantity on hand, audit trail of stock adjustments.
6. **Audit & Governance (`AuditLog`)**: Immutable audit entries capturing actor, action, timestamp, and JSON before/after state diffs.

---

## 📡 API & Real-Time Specifications

### Key REST Endpoints

| Category | Method | Path | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Service status, PostgreSQL latency, uptime | Public |
| **Docs** | `GET` | `/api/docs` | Interactive Swagger API Documentation | Public |
| **Auth** | `POST` | `/api/auth/login` | Login with email/password; returns JWT access/refresh | Public |
| **Auth** | `POST` | `/api/auth/register-clinic`| Submit new clinic registration application | Public |
| **Auth** | `GET` | `/api/auth/me` | Fetch active profile and effective permissions | Authenticated |
| **Superadmin** | `GET` | `/api/superadmin/clinics` | List all registered clinics across platform | `superadmin.*` |
| **Superadmin** | `POST`| `/api/superadmin/clinics/:id/approve` | Approve clinic registration & provision defaults | `superadmin.*` |
| **Clinical** | `GET` | `/api/clinical/patients` | Paginated search of clinic patient records | `patients.view` |
| **Clinical** | `POST`| `/api/clinical/patients` | Register new patient & generate unique MRN | `patients.create` |
| **Clinical** | `POST`| `/api/clinical/triage` | Submit nurse vitals, record chief complaints & issue token | `patients.edit` |
| **Clinical** | `GET` | `/api/clinical/triage/queue` | Fetch real-time triage queue for doctors/nurses | `patients.view` |
| **Pharmacy** | `GET` | `/api/pharmacy/inventory` | Query medicines, batch numbers, stock levels, DPCO alerts | `inventory.view` |
| **Pharmacy** | `POST`| `/api/pharmacy/prescriptions/:id/fulfill` | Dispense medications and deduct batch inventory | `prescriptions.edit` |
| **Billing** | `GET` | `/api/clinical/invoices` | List invoices, payments, outstanding balances | `billing.view` |
| **AI** | `POST`| `/api/ai/generate-category` | OpenRouter LLM generation of specialty workflows | `admin.*` |

### Real-Time WebSocket Protocol
- **Endpoint**: `ws://localhost:5000/ws/updates?userId=<USER_ID>`
- **Payload Example (Permission Invalidation)**:
  ```json
  {
    "event": "PERMISSIONS_UPDATED",
    "payload": {
      "type": "INVALIDATE_USER",
      "userId": "usr_9921",
      "timestamp": "2026-10-27T09:15:00.000Z"
    }
  }
  ```

---

## 🚀 Installation & Quick Start

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Recommended: `v20+` or `v24+`)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: Local instance or cloud database (e.g. Railway, Supabase, Neon)
- **Android Studio & SDK** (Optional, only needed for compiling `client-app` mobile app)

---

### 1. Backend API (`server/`)

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Configure environment variables (verify or copy .env)
# The default .env is pre-configured with a remote PostgreSQL database

# 4. Generate Prisma Client
npm run prisma:generate

# 5. Start the backend in development watch mode
npm run dev
```

*The API will start listening at `http://localhost:5000` with Swagger documentation at `http://localhost:5000/api/docs`.*

---

### 2. Frontend Web Application (`client-website/`)

```bash
# 1. Open a new terminal and navigate to client-website
cd client-website

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

*The web application will launch at `http://localhost:5173`.*

---

### 3. Mobile Application (`client-app/`)

```bash
# 1. Open a new terminal and navigate to client-app
cd client-app

# 2. Install dependencies
npm install

# 3. If testing on a physical Android device via USB:
adb reverse tcp:5000 tcp:5000

# 4. Start Metro bundler
npm run start

# 5. In another terminal, build and run on Android:
npm run android
```

> **Tip for Android Emulators**: If running on Android Studio Emulator without `adb reverse`, ensure `client-app/src/config/env.js` uses `http://10.0.2.2:5000`.

---

## 👥 Pre-Configured Demo Accounts

For fast local testing and demonstration, use these preset accounts (Password for all: `password123`):

| Role | Email | Password | Scope & Description |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@zuna.com` | `password123` | Platform Root: Approves clinics, manages subscriptions & global modules |
| **Clinic Admin** | `admin@aurahealth.org` | `password123` | Dr. Evelyn Vance: Manages staff, clinic settings, roles, permissions |
| **Doctor / MD** | `doctor@clinic.io` | `password123` | Dr. Sarah Al-Mansoor: Consultations, diagnosis, digital prescriptions |
| **Clinical Nurse**| `nurse@clinic.io` | `password123` | James C. Rodriguez: Triage queue, patient vitals, intake tokens |
| **Receptionist** | `reception@clinic.io`| `password123` | Elena Rostova: Patient registration, appointment booking, check-in |
| **Billing Officer**| `biller@clinic.io` | `password123` | Amara Chen: Invoices, GST calculations, payment receipts |

---

## ⚙️ Environment Variables Reference

### Backend (`server/.env`)
```ini
PORT=5000
NODE_ENV=development
HOST=0.0.0.0

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/DATABASE"

# Redis Cache (Local in-memory fallback activates automatically if unavailable)
REDIS_URL="redis://default:PASSWORD@HOST:PORT"

# JWT Authentication
JWT_ACCESS_SECRET="super-secret-access-token-key-clinical-os-2026"
JWT_REFRESH_SECRET="super-secret-refresh-token-key-clinical-os-2026"
JWT_ACCESS_EXPIRY="7d"

# CORS Allowed Origins
CORS_ORIGIN="http://localhost:5173,https://clienic.vercel.app"
API_PREFIX="/api"

# OpenRouter AI Integration
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="google/gemini-2.5-flash"
```

### Web Client (`client-website/.env`)
```ini
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5000

# Standalone Offline Simulator (Keep false when backend is running)
VITE_ENABLE_DEV_MOCK_SERVER=false
```

---

## 🧪 Testing & Verification Suites

The repository includes automated diagnostic scripts in `server/scripts/` to verify system health:

```bash
# Run unit & RBAC permission matrix tests
cd server
npm test

# Verify dynamic role templates
npm run test:template

# Seed and link clinical category departments
node scripts/seedCategoryDepartments.js

# Run knowledge graph update (AST analysis)
graphify update .
```

---

## 🚢 Deployment & Production Readiness

### Docker Production Build
The backend contains a production-ready multi-stage Dockerfile:
```bash
cd server
docker build -t clinic-api:latest .
docker run -p 5000:5000 --env-file .env clinic-api:latest
```

### Railway / Cloud Deployment
- **`Procfile`**: Pre-configured to execute database migrations and launch the Express server:
  ```
  web: npm run prisma:migrate && npm run start:server
  ```
- **`railway.json`**: Configured with automated healthchecks on `/api/health`.

### Frontend Production Build
To create an optimized production bundle of the web client:
```bash
cd client-website
npm run build
```
*The resulting static files in `dist/` can be deployed directly to Vercel, Netlify, AWS S3, or Cloudflare Pages.*

---

## 📄 License & Attribution
**clinic OS / Zuna Health Clinical Management ERP**  
Designed and engineered for high-performance clinical workflows, modern healthcare multi-tenancy, and regulatory compliance.
