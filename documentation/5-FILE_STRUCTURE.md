# File Structure & Code Explanation - Sattva Call Analysis Platform

## Table of Contents
1. [Project Root Files](#project-root-files)
2. [Frontend Structure](#frontend-structure)
3. [Backend Structure](#backend-structure)
4. [Configuration Files](#configuration-files)

---

## Project Root Files

### `package.json`
**Purpose**: NPM package configuration and dependency management

**Key Dependencies**:
- **React**: `^18.3.1` - UI framework
- **Vite**: `^5.4.19` - Build tool and dev server
- **Supabase JS**: `^2.57.4` - Backend client library
- **shadcn/ui**: Collection of Radix UI components
- **Recharts**: `^2.15.4` - Charting library
- **React Router DOM**: `^6.30.1` - Routing
- **Google Generative AI**: `^0.24.1` - AI analysis
- **React Hook Form**: `^7.61.1` - Form management
- **Zod**: `^3.25.76` - Schema validation

**Scripts**:
```json
{
  "dev": "vite",           // Start dev server
  "build": "vite build",   // Production build
  "preview": "vite preview" // Preview production build
}
```

---

### `vite.config.ts`
**Purpose**: Vite build configuration

**Content**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

**Features**:
- React SWC plugin for fast refresh
- Path alias `@` → `./src` for cleaner imports

---

### `tsconfig.json`
**Purpose**: TypeScript compiler configuration

**Key Settings**:
- `"target": "ES2020"` - Modern JavaScript features
- `"jsx": "react-jsx"` - React JSX transform
- `"strict": true` - Strict type checking
- Path mapping: `"@/*": ["./src/*"]`

---

### `tailwind.config.ts`
**Purpose**: Tailwind CSS configuration

**Customizations**:
- Custom color scheme
- Dark mode support
- Custom animations
- Extended theme for shadcn/ui components

---

### `.env` (not in repo)
**Purpose**: Environment variables

**Required Variables**:
```env
VITE_SUPABASE_URL=https://lsuuivbaemjqmtztrjqq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_GOOGLE_AI_API_KEY=AIza...
```

---

## Frontend Structure

### `src/main.tsx`
**Purpose**: Application entry point

**Code**:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

**Responsibilities**:
- Renders root React component
- Wraps app in BrowserRouter for routing
- Imports global styles

---

### `src/App.tsx`
**Purpose**: Main application component with routing

**Code Structure**:
```typescript
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Index from '@/pages/Index'
import CallDetails from '@/pages/CallDetails'
// ... other imports

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/call/:id" element={<CallDetails />} />
        <Route path="/analysis/:id" element={<AnalysisDetail />} />
        {/* ... other routes */}
      </Routes>
    </AuthProvider>
  )
}
```

**Responsibilities**:
- Wraps app in AuthProvider for global auth state
- Defines all routes
- Main routing logic

---

### `src/pages/Index.tsx`
**Purpose**: Main page with view-based routing for different user types

**Key Features**:
- View state management (`currentView`)
- Conditional rendering based on authentication
- Handles login flows for admin/manager/employee
- Redirects to appropriate dashboard after login

**View Types**:
```typescript
type ViewType = 'admin-login' | 'login-options' | 'manager-login' | 
                'employee-login' | 'dashboard' | 'profile'
```

**Authentication Flow**:
```typescript
useEffect(() => {
  if (authLoading) return
  
  if (!user) {
    // Allow navigation between login screens
    if (loginScreens.includes(currentView)) return
    setCurrentView('login-options')
    return
  }
  
  // User authenticated, go to dashboard
  if (userRole) {
    setCurrentView('dashboard')
  }
}, [user, userRole, authLoading, currentView])
```

---

### `src/contexts/AuthContext.tsx`
**Purpose**: Global authentication state management

**Exports**:
- `AuthContext` - React context
- `AuthProvider` - Context provider component
- `useAuth()` - Hook to access auth state

**State**:
```typescript
{
  user: User | null           // Current authenticated user
  session: Session | null     // Session data
  userRole: UserRole | null   // User's role (admin/manager/employee)
  company: Company | null     // User's company
  loading: boolean            // Auth loading state
}
```

**Key Functions**:

**1. `signInAdmin(email, password)`**
```typescript
// Authenticates admin user
// 1. Query admins table by email
// 2. Verify password using bcrypt comparison
// 3. Fetch company data
// 4. Store session in localStorage
// 5. Update AuthContext state
```

**2. `signInManager(email, password, companyId)`**
```typescript
// Authenticates manager user
// Similar flow to admin but requires company_id
```

**3. `signInEmployee(email, password, companyId)`**
```typescript
// Authenticates employee user
// Calls authenticate_employee RPC function
```

**4. `refreshUserData()`**
```typescript
// Re-fetches user data from database
// Updates role and company in state
// Used after profile updates
```

**5. `signOut()`**
```typescript
// Clears localStorage
// Resets all state to null
// Redirects to login
```

**Local Storage Key**: `custom_auth_session`

**Storage Format**:
```json
{
  "user": { "id": "uuid", "email": "...", ... },
  "role": "admin",
  "company_id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### `src/lib/supabase.ts`
**Purpose**: Supabase client configuration and type definitions

**Supabase Client**:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
```

**Type Definitions**:
- `Recording` - Call recording metadata
- `Analysis` - AI analysis results
- `UserProfile` - User profile data
- `Company` - Company information
- And many more...

---

### `src/components/` Directory

#### `src/components/dashboards/`

**`AdminDashboard.tsx`**
- **Purpose**: Admin role dashboard
- **Features**:
  - Company overview statistics
  - Call outcomes pie chart
  - Employee productivity table
  - Recent call history
  - Quick actions (add employee, assign phone, etc.)

**`ManagerDashboard.tsx`**
- **Purpose**: Manager role dashboard
- **Features**:
  - Team overview
  - Assigned clients
  - Team call statistics
  - Employee performance metrics

**`EmployeeDashboard.tsx`**
- **Purpose**: Employee role dashboard
- **Features**:
  - Personal productivity metrics
  - Assigned leads list
  - Recent call history
  - Phone dialer
  - Upcoming follow-ups

---

#### `src/components/auth/`

**`LoginOptions.tsx`**
- **Purpose**: Main login page with role selection
- **Features**:
  - Three buttons: Admin, Manager, Employee
  - Routes to respective login pages
  - Company branding

**`AdminLogin.tsx`**
- **Purpose**: Admin login form
- **Fields**: Email, Password
- **Validation**: Zod schema
- **Submit**: Calls `AuthContext.signInAdmin()`

**`ManagerLogin.tsx`**
- **Purpose**: Manager login form
- **Fields**: Email, Password, Company ID
- **Additional**: Company ID required for multi-company support

**`EmployeeLogin.tsx`**
- **Purpose**: Employee login form
- **Fields**: Email, Password, Company ID
- **Backend**: Calls `authenticate_employee` RPC

---

#### UI Components (`src/components/`)

**`Dashboard.tsx`**
- **Purpose**: Wrapper component that routes to role-specific dashboard
- **Logic**:
```typescript
const Dashboard = ({ onShowProfile }) => {
  const { userRole } = useAuth()
  
  if (userRole?.role === 'admin') return <AdminDashboard />
  if (userRole?.role === 'manager') return <ManagerDashboard />
  if (userRole?.role === 'employee') return <EmployeeDashboard />
  
  return <div>No dashboard for this role</div>
}
```

**`ProfilePage.tsx`**
- **Purpose**: User profile editing
- **Features**:
  - Role-specific profile fields
  - Password change functionality
  - Uses `update_admin_profile` RPC for admins

**`PhoneDialer.tsx`**
- **Purpose**: Call initiation interface
- **Features**:
  - Pre-filled lead number
  - Employee's assigned phone as "From"
  - Call button triggers Exotel API
  - Real-time call status display

**`AddLeadModal.tsx`**
- **Purpose**: Form to add single lead
- **Fields**: Name, Email, Contact, Client, Job, Group, Description
- **Validation**: Zod schema (10-digit phone, email format)
- **Submit**: Inserts into `leads` table

**`CSVUploadDialog.tsx`**
- **Purpose**: Bulk lead upload from CSV
- **Features**:
  - File selection
  - CSV parsing (PapaParse library)
  - Preview before upload
  - Bulk insert to database

**`CallHistoryManager.tsx`**
- **Purpose**: Display and manage call history
- **Features**:
  - Table of all calls
  - Filter by date, employee, outcome
  - View call details
  - Listen to recordings

**`AddRecordingModal.tsx`**
- **Purpose**: Upload call recording
- **Features**:
  - File upload to Supabase Storage
  - Assign to employee
  - Link to lead
  - Store metadata in `recordings` table

---

#### `src/components/ui/` (shadcn/ui components)

Pre-built, customizable components:
- **button.tsx** - Button component with variants
- **card.tsx** - Card layout component
- **dialog.tsx** - Modal dialog
- **form.tsx** - Form components
- **input.tsx** - Text input
- **select.tsx** - Dropdown select
- **table.tsx** - Data table
- **toast.tsx** - Toast notifications
- **badge.tsx** - Status badges
- **tabs.tsx** - Tab navigation
- And many more...

All components are fully typed with TypeScript and customizable via Tailwind classes.

---

### `src/hooks/` Directory

**`useSupabaseData.ts`**
- **Purpose**: Custom hook for fetching data from Supabase
- **Usage**:
```typescript
const { data, loading, error, refetch } = useSupabaseData(
  'table_name',
  { column: 'value' },
  ['*']
)
```

**`useAnalysisNotifications.ts`**
- **Purpose**: Polling hook for new analysis notifications
- **Features**: Checks for new analyses every 30 seconds

**`use-toast.ts`**
- **Purpose**: Toast notification hook
- **Usage**:
```typescript
const { toast } = useToast()
toast({ title: 'Success!', description: '...' })
```

**`use-mobile.tsx`**
- **Purpose**: Detects mobile devices
- **Returns**: Boolean indicating if viewport is mobile-sized

---

## Backend Structure (Supabase)

### `supabase/functions/` Directory

#### `webhook-call-capture/`
**Purpose**: Receives Exotel webhooks for call status updates

**File**: `index.ts`

**Flow**:
1. Receives POST request from Exotel
2. Parses webhook payload
3. Extracts call details (CallSid, Status, Duration, etc.)
4. Finds matching lead by phone number
5. Updates `call_history` record
6. Returns 200 OK

**Payload Example**:
```json
{
  "CallSid": "abc123",
  "Status": "completed",
  "Duration": "120",
  "RecordingUrl": "https://...",
  "DialCallStatus": "completed"
}
```

**Database Update**:
```typescript
await supabase
  .from('call_history')
  .update({
    exotel_status: payload.Status,
    exotel_duration: parseInt(payload.Duration),
    exotel_recording_url: payload.RecordingUrl,
    outcome: mapStatus(payload.Status),
    updated_at: new Date()
  })
  .eq('exotel_call_sid', payload.CallSid)
```

---

#### `exotel-proxy/`
**Purpose**: Proxy for Exotel API calls (if needed for CORS)

**Features**:
- Forwards requests to Exotel
- Handles authentication
- Returns response to frontend

---

#### `database-keepalive/`
**Purpose**: Prevents database connection timeout

**Function**: Runs periodic query to keep connection alive

---

### `supabase/migrations/` Directory

Migration files in chronological order:

**`20251204101902_fix_employee_manager_authentication.sql`**
- Fixes authentication for employees and managers

**`20251204102419_add_get_company_by_id_function.sql`**
- Creates RPC function to fetch company by ID

**`20251204105327_add_admin_authentication.sql`**
- Adds admin authentication logic

**`20251204105855_disable_all_rls.sql`**
- Disables Row Level Security (for development)

**`20251204110129_create_admins_table.sql`**
- Creates admins table

**`20251211081516_create_phone_numbers_table.sql`**
- Creates phone_numbers table with employee assignment

**`20251211074513_add_admin_profile_update_functions.sql`**
- Adds RPC functions:
  - `update_admin_profile`
  - `update_admin_password`

**`20251211080059_add_update_company_function.sql`**
- Adds `update_company_info` RPC function

---

### Database Functions (RPC)

#### `authenticate_employee(p_email, p_password, p_company_id)`
**Purpose**: Validates employee login

**SQL**:
```sql
CREATE OR REPLACE FUNCTION authenticate_employee(
  p_email VARCHAR,
  p_password VARCHAR,
  p_company_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name VARCHAR,
  email VARCHAR,
  ...
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.*
  FROM employees e
  WHERE e.email = p_email
    AND e.company_id = p_company_id
    AND e.password = crypt(p_password, e.password)
    AND e.is_active = true;
END;
$$ LANGUAGE plpgsql;
```

---

#### `update_admin_profile(...)`
**Purpose**: Updates admin profile information

**Parameters**:
- `p_admin_id` - Admin UUID
- `p_full_name` - New name
- `p_email` - New email
- `p_phone` - New phone

**Returns**: Updated admin record

---

#### `update_admin_password(...)`
**Purpose**: Changes admin password

**Parameters**:
- `p_admin_id` - Admin UUID
- `p_current_password` - Current password for verification
- `p_new_password` - New password

**Security**: Verifies current password before updating

---

#### `update_company_info(...)`
**Purpose**: Updates company information

**Parameters**:
- `p_company_id` - Company UUID
- Company fields (name, email, industry, etc.)

**Returns**: Updated company record

---

#### `get_company_by_id(p_company_id)`
**Purpose**: Fetches company details

**Returns**: Single company record

---

## Configuration Files

### `components.json` (shadcn/ui config)
**Purpose**: shadcn/ui component configuration

**Settings**:
- Component style: "default"
- Tailwind config path
- Component path: `src/components/ui`
- Utilities path: `src/lib/utils.ts`

---

### `netlify.toml` / `vercel.json`
**Purpose**: Deployment configuration for hosting platforms

**Netlify**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### `postcss.config.js`
**Purpose**: PostCSS configuration for Tailwind

**Content**:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

---

### `eslint.config.js`
**Purpose**: ESLint configuration for code quality

**Rules**:
- React best practices
- TypeScript checks
- Unused variable warnings

---

## File Naming Conventions

### Components
- **PascalCase**: `AddLeadModal.tsx`, `Dashboard.tsx`
- **Descriptive names**: Component purpose clear from name

### Hooks
- **camelCase with 'use' prefix**: `useSupabaseData.ts`, `useToast.ts`

### Utilities
- **camelCase**: `utils.ts`, `supabase.ts`

### Types/Interfaces
- **PascalCase**: `UserRole`, `Company`, `Recording`

### Constants
- **UPPER_SNAKE_CASE**: `API_URL`, `MAX_FILE_SIZE`

---

## Code Organization Best Practices

### Imports Order
```typescript
// 1. React imports
import { useState, useEffect } from 'react'

// 2. Third-party libraries
import { useForm } from 'react-hook-form'

// 3. Internal utilities
import { supabase } from '@/lib/supabase'

// 4. Components
import { Button } from '@/components/ui/button'

// 5. Types
import type { UserRole } from '@/contexts/AuthContext'
```

### Component Structure
```typescript
// 1. Imports
import ...

// 2. Types/Interfaces
interface Props { ... }

// 3. Component
export const Component = ({ props }: Props) => {
  // 3a. Hooks
  const [state, setState] = useState()
  const { data } = useCustomHook()
  
  // 3b. Functions
  const handleClick = () => { ... }
  
  // 3c. Effects
  useEffect(() => { ... }, [deps])
  
  // 3d. Render
  return (...)
}
```

---

## Summary

### Frontend Architecture
- **React + TypeScript** for type safety
- **Vite** for fast development and optimized builds
- **shadcn/ui** for consistent, accessible UI components
- **React Router** for client-side routing
- **Context API** for global state (auth)
- **Custom hooks** for reusable logic

### Backend Architecture
- **Supabase PostgreSQL** for data storage
- **Edge Functions** for serverless backend logic
- **RPC Functions** for complex queries and auth
- **Supabase Storage** for file uploads

### Key Patterns
- **Custom authentication** with localStorage (not Supabase Auth)
- **Role-based access control** via UserRole
- **Type-safe database queries** with TypeScript
- **Modular component structure** for maintainability
- **Webhook-driven updates** for real-time call status
