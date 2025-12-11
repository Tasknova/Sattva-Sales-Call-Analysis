# System Architecture - Sattva Call Analysis Platform

## Overview
Sattva Call Analysis is a comprehensive call management and analytics platform built for recruitment companies. It enables admins, managers, and employees to manage leads, make calls, analyze conversations, and track productivity metrics.

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router DOM 6.30.1
- **UI Components**: 
  - shadcn/ui (Radix UI components)
  - Tailwind CSS 3.4.17
  - Framer Motion for animations
  - Lucide React for icons
- **Charts & Visualization**: Recharts 2.15.4
- **State Management**: React Context API
- **Form Handling**: React Hook Form 7.61.1 with Zod validation
- **API Client**: Supabase JS Client 2.57.4

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom authentication system using localStorage
- **API**: Supabase REST API + RPC Functions
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Storage**: Supabase Storage for call recordings

### Third-Party Integrations
- **Calling Service**: Exotel API for making and managing calls
- **AI Analysis**: Google Generative AI (Gemini) for call transcript analysis

## Architecture Pattern

### Client-Server Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admin UI   │  │  Manager UI  │  │ Employee UI  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                  ┌────────▼─────────┐                       │
│                  │  AuthContext     │                       │
│                  │  (State Mgmt)    │                       │
│                  └────────┬─────────┘                       │
│                           │                                 │
│                  ┌────────▼─────────┐                       │
│                  │  Supabase Client │                       │
│                  └────────┬─────────┘                       │
└───────────────────────────┼─────────────────────────────────┘
                            │
                   HTTPS (REST/WebSocket)
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Supabase Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │ Edge Functions│ │    Storage   │      │
│  │   Database   │  │  - webhook   │  │  (Recordings)│      │
│  │              │  │  - proxy     │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                 │                                 │
│  ┌──────▼────────────┐    │                                 │
│  │  RPC Functions    │    │                                 │
│  │  - Auth           │    │                                 │
│  │  - Profile Update │    │                                 │
│  │  - Company Mgmt   │    │                                 │
│  └───────────────────┘    │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    External APIs
                            │
           ┌────────────────┴────────────────┐
           │                                 │
    ┌──────▼───────┐              ┌─────────▼────────┐
    │  Exotel API  │              │  Google AI API   │
    │  (Calling)   │              │  (Analysis)      │
    └──────────────┘              └──────────────────┘
```

## Database Architecture

### Core Tables

#### 1. **User Management Tables**
- **companies**: Stores company/organization information
- **admins**: Admin user profiles with company association
- **managers**: Manager user profiles with company and department info
- **employees**: Employee user profiles with manager assignment
- **user_roles**: Maps users to their roles (admin/manager/employee)
- **user_profiles**: Additional user profile data

#### 2. **CRM Tables**
- **clients**: Client/customer organizations
- **jobs**: Job postings from clients
- **leads**: Lead/candidate information
- **lead_groups**: Grouping of leads for organization
- **lead_assignments**: Assignment of leads to employees
- **removed_leads**: Audit trail of removed leads

#### 3. **Communication Tables**
- **call_history**: Complete call records with Exotel integration
- **call_outcomes**: Call outcome tracking
- **recordings**: Audio recording metadata and storage links
- **analyses**: AI-generated call analysis results

#### 4. **Productivity & Settings Tables**
- **employee_daily_productivity**: Daily metrics per employee
- **metrics_aggregates**: Aggregated performance metrics
- **phone_numbers**: Phone number assignments to employees
- **company_settings**: Company-specific Exotel configuration
- **manager_client_assignments**: Client assignments to managers

### Key Relationships
```
companies (1) ──→ (N) admins
companies (1) ──→ (N) managers
companies (1) ──→ (N) employees
companies (1) ──→ (N) clients
companies (1) ──→ (N) phone_numbers

managers (1) ──→ (N) employees
managers (1) ──→ (N) lead_groups
managers (1) ──→ (N) phone_numbers

employees (1) ──→ (N) call_history
employees (1) ──→ (1) phone_numbers (unique assignment)

clients (1) ──→ (N) jobs
jobs (1) ──→ (N) leads
lead_groups (1) ──→ (N) leads

leads (1) ──→ (N) call_history
call_history (1) ──→ (N) recordings
recordings (1) ──→ (N) analyses
```

## Application Layers

### 1. Presentation Layer (UI Components)
- **Pages**: Route-level components (Index, CallDetails, AnalysisDetail, etc.)
- **Dashboards**: Role-specific dashboards (Admin, Manager, Employee)
- **Components**: Reusable UI components (modals, forms, tables)
- **Auth Components**: Login/signup flows for different roles

### 2. Business Logic Layer
- **Contexts**: AuthContext for authentication and session management
- **Hooks**: Custom React hooks (useSupabaseData, useAnalysisNotifications, etc.)
- **Utils**: Helper functions for data transformation and validation

### 3. Data Access Layer
- **Supabase Client**: Direct database queries via Supabase JS
- **RPC Functions**: Server-side business logic:
  - `authenticate_employee`: Employee login validation
  - `update_admin_profile`: Admin profile updates
  - `update_admin_password`: Password change
  - `update_company_info`: Company information updates
  - `get_company_by_id`: Fetch company details

### 4. Integration Layer
- **Exotel Integration**: Call initiation and management
- **Google AI Integration**: Call transcript analysis
- **Edge Functions**: 
  - `webhook-call-capture`: Receives Exotel webhooks
  - `exotel-proxy`: Proxies Exotel API calls
  - `database-keepalive`: Maintains database connection

## Authentication & Authorization

### Custom Authentication Flow
1. User enters credentials on role-specific login page
2. Frontend calls Supabase RPC function (`authenticate_employee`, admin/manager login)
3. Password validated against hashed value in database
4. On success, user data stored in localStorage (`custom_auth_session`)
5. AuthContext manages session state across app
6. Route guards check authentication and role before rendering

### Role-Based Access Control (RBAC)
- **Admin**: Full access to company data, user management, reports
- **Manager**: Access to assigned clients, teams, and their metrics
- **Employee**: Access to assigned leads and personal call history

## Deployment Architecture

### Frontend Hosting
- Static site deployment (Netlify/Vercel compatible)
- Environment variables for Supabase connection
- Build output optimized with Vite

### Backend Services
- Supabase hosted PostgreSQL database
- Supabase Edge Functions deployed on Deno runtime
- Supabase Storage for file uploads

### CDN & Assets
- Static assets served via CDN
- Call recordings stored in Supabase Storage buckets
- Optimized image and font loading

## Security Features

1. **Password Security**: Bcrypt hashing for all passwords
2. **Session Management**: Token-based with localStorage
3. **API Security**: Supabase Row Level Security (currently disabled, but tables configured)
4. **Input Validation**: Zod schemas for all form inputs
5. **Environment Variables**: Sensitive keys stored in env files
6. **CORS**: Configured for specific origins

## Scalability Considerations

1. **Database Indexing**: Primary keys and foreign keys indexed
2. **Query Optimization**: Selective field fetching, pagination support
3. **Caching**: Browser caching for static assets
4. **Edge Functions**: Serverless auto-scaling
5. **Connection Pooling**: Supabase handles connection management

## Monitoring & Logging

1. **Client-Side**: Console logging for debugging (development only)
2. **Server-Side**: Supabase logging for queries and edge functions
3. **Error Tracking**: Try-catch blocks with error state management
4. **Performance**: React DevTools for component profiling

## Future Architecture Improvements

1. Enable Row Level Security (RLS) for data isolation
2. Implement Redis caching layer for frequently accessed data
3. Add WebSocket support for real-time call status updates
4. Migrate to more robust state management (Redux/Zustand)
5. Implement service worker for offline capability
6. Add comprehensive logging and monitoring solution
7. Implement automated backup and disaster recovery
