# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AnchorView is a Next.js application for managing industrial climbing anchor points, streamlining inspection and maintenance workflows. It uses TypeScript, React, Prisma ORM with PostgreSQL, and includes AI features powered by Google's Genkit framework.

## Common Development Commands

### Local Development
```bash
# Start development server (without Docker)
npm run dev                  # Runs on port 9002 with Turbopack
npm run dev:no-turbo         # Without Turbopack (fallback if issues)
npm run dev:clean            # Clean .next folder and start fresh

# Start development with Docker (includes PostgreSQL)
docker-compose up --build    # Full stack with database

# Start Genkit AI development UI
npm run genkit:dev          # Basic Genkit dev mode
npm run genkit:watch        # Genkit with auto-reload (recommended)
```

### Database Management
```bash
# Generate Prisma client (runs automatically on npm install)
npx prisma generate

# Run migrations (development)
npx prisma migrate dev

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npm run db:reset

# Setup database (run migrations)
npm run db:setup

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Code Quality
```bash
# Run linting
npm run lint

# Type checking
npm run typecheck

# Build production bundle
npm run build
```

### Mobile Development (Capacitor)
```bash
# Add iOS platform (macOS only)
npx cap add ios
npx cap sync ios
npx cap open ios

# Add Android platform
npx cap add android
npx cap sync android
npx cap open android

# Sync changes after code updates
npm run build
npx cap sync
```

See [setup-mobile.md](setup-mobile.md) for detailed mobile setup instructions.

## Mobile Implementation (Capacitor + PWA)

AnchorView is a hybrid application combining PWA capabilities with native mobile features via Capacitor:

### Native Capacitor Features (iOS & Android)
- **Native Camera Access**: 100% quality photo capture without compression
- **Gallery Storage**: Photos saved directly to device gallery with structured filenames
  - Format: `AnchorView_[Projeto]_[Progressao]_[Ponto]_[IDUnico]_[Tipo]_[Data]_[Hora].jpg`
  - Example: `AnchorView_EdSolar_Horizontal_P1_a3b4c5d6_Ponto_20250120_153045.jpg`
- **Filesystem Access**: Read/write photos from device storage
- **Metadata Storage**: Only ~500 bytes per photo in IndexedDB (not full image)
- **Background Sync**: Automatic photo upload when connection returns
- **Offline-First**: Full functionality without internet connection

### Key Capacitor Files
- `/capacitor.config.ts` - Capacitor configuration (camera quality 100%)
- `/src/lib/gallery-photo-service.ts` - Photo capture and storage service
- `/src/components/camera-capture-capacitor.tsx` - Native camera component
- `/src/components/photo-sync-manager.tsx` - Photo synchronization UI
- `/src/app/api/sync/photos/route.ts` - Photo upload endpoint
- `/src/app/api/sync/anchor-data/route.ts` - Data sync endpoint

## PWA Implementation

AnchorView is also a complete Progressive Web App (PWA) with offline capabilities for field workers:

### PWA Features
- **Offline Photo Capture**: Workers can capture photos and lacre numbers without internet
- **Background Sync**: Automatic data synchronization when connection returns (even with PWA closed)
- **Service Worker**: Comprehensive offline caching and sync management
- **IndexedDB Storage**: Robust offline storage with retry logic and conflict resolution
- **Push Notifications**: Alerts for sync status and inspection reminders
- **Installable**: Can be installed as native app on mobile devices

### Key PWA Files
- `/public/manifest.json` - PWA manifest configuration
- `/public/sw.js` - Service Worker with background sync
- `/src/lib/pwa-integration.ts` - PWA integration manager
- `/src/lib/indexeddb-storage.ts` - Offline storage management
- `/src/components/offline-photo-capture.tsx` - Optimized photo capture component
- `/src/app/pwa-setup/page.tsx` - PWA setup and testing page
- `/src/app/offline/page.tsx` - Offline fallback page

### Testing PWA Features
1. Visit `/pwa-setup` to configure and test PWA features
2. Test offline photo capture functionality
3. Check background sync status and manual sync
4. Test installation and notification permissions

### API Endpoints for Sync
- `/api/sync/photos` - Photo synchronization endpoint
- `/api/sync/anchor-data` - Anchor data synchronization endpoint

**Note**: The codebase shows PWA sync API endpoints listed but no actual API route files were found in `src/app/api/`. This suggests sync may be handled through service workers and IndexedDB directly, or these endpoints need to be implemented.

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives with shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Google Genkit with Gemini 2.0 Flash model
- **State Management**: React Context API (AnchorDataContext, AuthContext)
- **Styling**: Tailwind CSS with custom theme (primary: #6941DE violet)

### Key Architectural Patterns

#### 1. Data Architecture
- **Hybrid Storage**: Database (Prisma/PostgreSQL) for Companies, Users, Projects, Locations; localStorage for AnchorPoints and AnchorTests
- **Context-based State**: AnchorDataContext manages all application state and provides data access methods
- **Server Actions**: Next.js server actions in `src/app/actions/` for database operations

#### 2. Component Structure
- **Landing Page**: Public landing page at `src/app/page.tsx` (or `src/app/(public)/page.tsx`)
- **Main Application**: Authenticated app at `src/app/app/page.tsx` with `<AnchorView>` component
- **Tab Components**: Modular tabs (DashboardTab, PointsTab, TestsTab, MapTab, ReportsTab, etc.) in `src/components/`
- **Shared UI**: Reusable components in `src/components/ui/` following shadcn patterns
- **Modal System**: Dialog-based modals for forms and detailed views

#### 3. Authentication & Multi-tenancy
- **Company-based Isolation**: All data is scoped to companies
- **User Roles**: Four-tier role hierarchy for granular permissions:
  - `superadmin`: System owner with full access to all features and companies
  - `company_admin`: Property managers who create projects, manage teams, and view maps (read-only on maps)
  - `team_admin`: Rope access team leaders who can edit maps for assigned projects and invite technicians
  - `technician`: Field workers who can only perform tests on existing anchor points
- **Permissions System**: Centralized permission logic in `src/lib/permissions.ts` with functions for each capability (canEditMap, canCreatePoints, canInviteUsers, etc.)
- **Auth Contexts**: Multiple auth contexts for different scenarios:
  - `AuthContext` - Standard authentication
  - `OfflineAuthContext` - Offline-capable authentication
  - `DatabaseAuthContext` - Database-backed authentication
- **Subscription Management**: Trial periods, subscription plans (basic/pro/enterprise), usage limits tracked per company

#### 4. Core Features Implementation
- **Interactive Map**: Canvas-based floor plan with clickable anchor points (`src/components/interactive-map.tsx`)
- **Camera Integration**: Direct photo capture for inspections (`src/components/camera-capture.tsx`)
- **Export System**: Multiple format exports (Excel, PDF, JSON) in `src/lib/export.ts`
- **AI Inspection Flags**: Automated inspection alerts using Genkit flows (`src/ai/flows/`)

### Important Design Decisions

1. **localStorage for Points/Tests**: Anchor points and tests remain in localStorage for offline capability, with sync status indicators
2. **Base64 Image Storage**: All images (floor plans, point photos) stored as base64 data URLs
3. **Soft Deletes**: Points use archived flag rather than hard deletion
4. **Project-scoped Data**: All anchor points belong to a project within a company
5. **Real-time Sync Status**: Visual indicators show save states (idle/saving/saved/error)

### Type System
All core types defined in `src/types/index.ts`:
- Company, User, Location, Project (database entities)
- AnchorPoint, AnchorTest, AnchorTestResult (localStorage entities)
- MarkerShape, status enums

### Environment Variables Required
See `.env.example` for the complete template. Key variables:
- `DATABASE_URL`: PostgreSQL connection string (format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`)
- `GEMINI_API_KEY`: Google AI API key for Genkit features (get from https://aistudio.google.com/app/apikey)
- Docker-specific: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

## Key Application Routes

### Public Routes
- `/` - Landing page with features and pricing
- `/auth/login` - User login
- `/auth/register` - User registration

### Authenticated Routes
- `/app` - Main application (requires login)
- `/admin` - Admin dashboard (superadmin only)
- `/configuracoes` - Settings page
- `/pwa-setup` - PWA configuration and testing
- `/sync` - Sync status and management
- `/offline` - Offline fallback page
- `/billing` - Subscription and billing management

## Context Providers

The application uses multiple React Context providers for state management:

1. **AnchorDataContext** (`src/context/AnchorDataContext.tsx`)
   - Central data management for all anchor-related data
   - Manages projects, points, tests, users, locations
   - Provides CRUD operations for all entities
   - Handles sync status (idle/saving/saved/error)
   - Manages line tool mode for creating multiple points in a line

2. **OfflineAuthContext** (`src/context/OfflineAuthContext.tsx`)
   - Offline-capable authentication
   - Tracks online/offline status
   - Manages sync operations

3. **OfflineDataContext** (`src/context/OfflineDataContext.tsx`)
   - Manages offline data storage
   - Coordinates with IndexedDB for persistence

## Server Actions

Next.js server actions are located in `src/app/actions/`:
- `auth.ts` - Authentication actions
- `user-actions.ts` - User management (CRUD)
- `project-actions.ts` - Project and location management
- `anchor-actions.ts` - Anchor point operations
- `sync-actions.ts` - Data synchronization

## Important Files to Know

### Core Libraries
- `src/lib/export.ts` - Export functionality (Excel, PDF, DOCX) for reports
- `src/lib/pwa-integration.ts` - PWA service worker integration
- `src/lib/indexeddb-storage.ts` - IndexedDB management for offline storage
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/utils.ts` - Utility functions (includes `cn` for class names)

### PWA Files
- `public/sw.js` - Service Worker for offline functionality
- `public/manifest.json` - PWA manifest

### AI/Genkit
- `src/ai/genkit.ts` - Genkit configuration (uses Gemini 2.0 Flash)
- `src/ai/flows/flag-points-for-inspection.ts` - AI flow for automated inspection flagging

## Development Notes

### Hybrid Data Storage Strategy
- **Database** (via Prisma): Companies, Users, Projects, Locations, Subscriptions, Audit logs
- **localStorage**: AnchorPoints and AnchorTests (for offline capability)
- **IndexedDB**: PWA offline cache, sync queue, photos pending upload

This hybrid approach enables offline-first operation while maintaining relational integrity for core business entities.

### Image Handling
- All images stored as base64 data URLs (floor plans, anchor point photos, test photos)
- Photos can be compressed for offline storage
- PWA tracks `photoUploadPending` flag for deferred uploads

### Subscription & SaaS Features
The application includes comprehensive SaaS functionality:
- Trial management with expiration tracking
- Usage limits per subscription plan (max users, projects, points, storage)
- Payment integration with MercadoPago
- Admin activity logging
- Backup and restore capabilities
- Usage analytics tracking

---

## 🔐 Permission System

The application implements a comprehensive 4-tier role-based permission system:

### Role Hierarchy

1. **Superadmin** (`superadmin`)
   - System owner with full access
   - Can manage all companies, users, projects
   - Access to admin dashboard at `/admin`
   - Can perform all operations

2. **Company Admin** (`company_admin`)
   - Manages property/building administration
   - Can create and manage projects
   - Can invite and manage teams
   - **View-only access to maps** (cannot edit anchor points)
   - First user registered becomes company_admin automatically

3. **Team Admin** (`team_admin`)
   - Rope access team leader
   - Can edit maps for assigned projects
   - Can create/edit/delete anchor points
   - Can invite technicians to their team
   - Project access controlled via ProjectTeamPermission

4. **Technician** (`technician`)
   - Field worker with minimal permissions
   - Can only perform tests on existing points
   - Cannot create, edit, or delete points
   - Cannot manage users or teams

### Permission Functions

All permission checks are centralized in `src/lib/permissions.ts`:

```typescript
canEditMap(user, projectId?)       // team_admin, superadmin
canCreatePoints(user, projectId?)  // company_admin, team_admin, superadmin
canInviteUsers(user, roleToInvite?) // Based on role hierarchy
canManageTeams(user)                // company_admin, superadmin
canPerformTests(user)               // All roles except when restricted
```

### Implementation Notes

- Permissions are checked at UI level (hiding buttons/features) and server level (in actions)
- Database schema includes `ProjectTeamPermission` for granular team access
- Team assignments link users to specific projects via teams
- Public projects bypass authentication for read-only access via tokens

---

## 📚 Additional Documentation

### Product Evolution Proposals
The following documents contain detailed proposals for evolving AnchorView into a B2B2C platform:

- **PROPOSTA_PERMISSOES_E_FEATURES.md** - Complete analysis of permissions system and future features (Teams, public view, notifications, equipment tracking, etc.)
- **IMPLEMENTACAO_PRIORIDADE_1.md** - Prisma schema and implementation code for Teams system + Public Project Visualization
- **RESUMO_EXECUTIVO.md** - Strategic product vision, business model, roadmap, and market analysis

### Planned Evolution
The system is evolving from a simple model (Company → Projects → Points) to a B2B2C model:
- **Property Management Companies** (paying customers) manage multiple buildings
- **Rope Access Teams** (service providers) receive granular permissions per project
- **Public** (residents/tenants) access inspection history via public URL/QR Code

**Priority 1**: Teams System + Public Visualization (3-4 weeks dev time)

Key features to implement:
1. Team entity with CNPJ, certifications, insurance info
2. ProjectTeamPermission for granular access control
3. ProjectPublicSettings for public URL generation
4. Public page at `/public/project/[token]` (no authentication)
5. Problem reporting system for anonymous users

---

**Document created**: 2025-10-20
**Last updated**: 2025-10-21
**Version**: 1.2

## 📝 Recent Changes

### Version 1.2 (2025-10-21)
- ✅ Implemented 4-tier role system (superadmin, company_admin, team_admin, technician)
- ✅ Migrated from 3-role to 4-role hierarchy across entire codebase
- ✅ Created centralized permissions system in `src/lib/permissions.ts`
- ✅ Updated all components, contexts, and server actions to use new roles
- ✅ Fixed TypeScript errors related to role system (33 files updated)
- ✅ Company admins now have view-only access to maps
- ✅ Team admins can edit maps for their assigned projects
- ✅ Technicians restricted to testing only