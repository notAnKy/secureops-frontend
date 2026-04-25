# SecureOps — Cybersecurity Management Platform

<div align="center">

![SecureOps](https://img.shields.io/badge/SecureOps-Cybersecurity%20Platform-00ffd2?style=for-the-badge&logo=shield&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

**A full-stack cybersecurity management platform connecting companies with expert security specialists.**  
Submit requests · Assign tasks · Validate reports · All in one place.

</div>

---

## Overview

SecureOps is a role-based cybersecurity service management platform built as a full-stack academic project. It enables companies (clients) to submit security service requests, track their progress in real time, and receive validated reports from specialist employees — all managed by an admin team.

The platform features three completely separate portals, each tailored to its user role, with a professional dark UI designed around a cybersecurity aesthetic.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI Framework |
| TypeScript | 5 | Type Safety |
| Vite | 5 | Build Tool |
| React Router | v6 | Client-side Routing |
| Axios | — | HTTP Client with JWT interceptor |
| Custom CSS-in-JS | — | Design system with CSS variables |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Spring Boot | 3.5 | REST API Framework |
| Spring Security | 6 | Authentication & Authorization |
| JWT (jjwt) | 0.11.5 | Stateless Token Auth |
| Spring Data JPA | — | ORM / Data Access |
| Hibernate | 6.6 | Database Mapping |
| Spring Mail | — | Email Notifications |
| PostgreSQL | 17 | Primary Database |
| Maven | — | Build Tool |

---

## Features

### Authentication & Security
- JWT-based stateless authentication with 24-hour token expiry
- Role-based access control (ADMIN / CLIENT / EMPLOYEE)
- BCrypt password hashing
- Forgot password flow with email reset link (1-hour expiry)
- Protected routes with role-aware redirects

### Admin Portal
- Real-time analytics dashboard with animated donut & bar charts
- User management with pagination, search, and role filtering
- Employee creation and editing
- Service catalog management (full CRUD)
- Request management with status updates
- Task creation and specialist assignment with speciality filtering
- Report validation/invalidation with automated email notifications
- Pending requests badge with live count in sidebar

### Client Portal
- Animated stats dashboard with spotlight page tour
- 3-step service request submission wizard
- Request tracking with status timeline
- Validated report viewing and PDF download
- Profile management (contact info, address, password change)
- AI-powered chatbot assistant (SecureBot — powered by Gemini)

### Employee Portal
- Task list with status filtering and search
- Task status updates (Not Started / In Progress / Completed / Resolved)
- Report submission per task
- Profile management with speciality display

### General
- Mobile responsive with hamburger drawer navigation on all portals
- Loading skeleton states on heavy data pages
- Toast notification system
- Custom 404 page with role-aware redirect
- Legal pages (Terms of Service & Privacy Policy)
- Email notifications via Mailtrap SMTP

---

## Screenshots

### 🌐 Public Pages

#### Home Page
![Home Page](./screenshots/home.png)
> Landing page with navigation, hero section, and call-to-action buttons.

#### Login Page
![Login Page](./screenshots/login.png)
> Split-panel login with animated grid background, terminal typing animation, and system stats. Includes "Forgot password?" link.

#### Sign Up Page
![Sign Up Page](./screenshots/signup.png)
> 3-step company registration wizard with animated step indicator, field validation, and password strength meter.

#### Forgot Password
![Forgot Password](./screenshots/forgot-password.png)
> Email-based password reset flow. Sends a secure 1-hour reset link via email.

#### Legal Page
![Legal Page](./screenshots/legal.png)
> Terms of Service, Privacy Policy, Security Practices, and Contact information.

---

### 🔐 Admin Portal

#### Admin Dashboard
![Admin Dashboard](./screenshots/admin-dashboard.png)
> Platform-wide analytics with animated stat cards, a donut chart showing request status breakdown, and a bar chart for platform overview. Pending requests badge on sidebar.

#### Manage Users
![Manage Users](./screenshots/admin-users.png)
> Paginated user table with role filtering (All / Client / Employee / Admin), search, employee creation, editing, and deletion with activity warning modal.

#### Manage Services
![Manage Services](./screenshots/admin-services.png)
> Service catalog with type filtering, search, pricing display, and full CRUD operations.

#### View Requests
![View Requests](./screenshots/admin-requests.png)
> All client requests with status filtering, search, inline status updates via dropdown, and total value display.

#### Assign Tasks
![Assign Tasks](./screenshots/admin-tasks.png)
> Full request detail view with task creation, employee assignment (with speciality chips), report viewing, and validate/invalidate actions.

---

### 👤 Client Portal

#### Client Dashboard — Spotlight Tour
![Client Dashboard](./screenshots/client-dashboard-tour.png)
> Animated stats dashboard with a unique spotlight tour feature that highlights and explains each section with a dark overlay and teal cutout.

#### Client Dashboard
![Client Dashboard](./screenshots/client-dashboard.png)
> Overview of request stats, quick action buttons, recent requests table, and account details. SecureBot AI chatbot accessible via floating button.

#### SecureBot AI Assistant
![SecureBot](./screenshots/client-chatbot.png)
> Gemini-powered AI chatbot with suggested questions, typing indicators, and full conversation history. Knows everything about the platform.

#### My Requests
![My Requests](./screenshots/client-requests.png)
> All submitted requests with status badges, priority levels, estimated values, and filters.

#### Create Request
![Create Request](./screenshots/client-create-request.png)
> 3-step request form: select services → add description & priority → review & submit.

#### Request Details
![Request Details](./screenshots/client-request-details.png)
> Full request view with status timeline, selected services, total estimate, validated reports, and PDF download button.

#### Client Profile
![Client Profile](./screenshots/client-profile.png)
> Edit contact information, company address, and phone. Locked fields (company name, SIRET, user code). Password change section.

---

### 👷 Employee Portal

#### My Tasks
![My Tasks](./screenshots/employee-tasks.png)
> All assigned tasks with stat summary cards, status filtering, search, and quick status display.

#### Task Details
![Task Details](./screenshots/employee-task-details.png)
> Full task view with report submission form, status update panel, assigned team display, and validated report history.

#### Employee Profile
![Employee Profile](./screenshots/employee-profile.png)
> Edit personal contact info. Locked fields (employee code, speciality set by admin). Password change section.

---

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── auth/          # Login, SignUp, ForgotPassword, ResetPassword, LegalPage
│   │   ├── admin/         # AdminLayout, AdminDashboard, ManageUsers, ManageServices,
│   │   │                  # ViewRequests, AssignTasks
│   │   ├── client/        # ClientLayout, Dashboard, CreateRequest, MyRequests,
│   │   │                  # RequestDetails, Profile, ChatBot
│   │   └── employee/      # EmployeeLayout, MyTasks, TaskDetails, EmployeeProfile
│   ├── services/
│   │   ├── api.ts          # Axios instance with JWT auto-injection
│   │   └── auth.service.ts # JWT decode, role extraction, localStorage
│   └── components/
│       └── Toast.tsx       # Global toast notification system
├── .env.example            # Environment variables template
└── .gitignore
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend running on `http://localhost:8081` (see [secureops-backend](https://github.com/notAnKy/secureops-backend))

### Installation

```bash
# Clone the repository
git clone https://github.com/notAnKy/secureops-frontend.git
cd secureops-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Gemini API key

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com)

---

## Backend Repository

The Spring Boot backend for this project is available at:  
👉 **[secureops-backend](https://github.com/notAnKy/secureops-backend)**

---

## User Roles

| Role | Access | Description |
|---|---|---|
| **Admin** | `/admin/*` | Full platform management |
| **Client** | `/client/*` | Submit and track security requests |
| **Employee** | `/employee/*` | Manage assigned tasks and submit reports |

### Default Test Accounts
> Create your own accounts through the registration flow or via the admin portal.

---

## Request Lifecycle

```
Client submits request
        ↓
Admin reviews → assigns tasks to employees
        ↓
Employees work → update status → submit reports
        ↓
Admin validates reports → client gets email notification
        ↓
Client views & downloads validated reports as PDF
```

---

## Key Design Decisions

- **Dark cybersecurity aesthetic** — custom CSS design system with `#00ffd2` teal accent, `JetBrains Mono` for data, and `Syne` for headings
- **No UI component library** — all components built from scratch with CSS-in-JS
- **Stateless JWT auth** — no sessions, tokens stored in localStorage
- **Single user table** — all roles stored in one table with nullable role-specific fields
- **Spotlight tour** — built with pure SVG, no external tour library

---

## AI Chatbot Setup (SecureBot)

> ⚠️ The file `src/pages/client/ChatBot.tsx` is **not included** in this repository for security reasons (it contains an API key). Follow the steps below to set it up yourself.

### What is SecureBot?
SecureBot is a floating AI assistant available on all client portal pages. It is powered by Google's Gemini API and is pre-instructed to answer questions about the SecureOps platform — how to submit requests, understand statuses, access reports, and more.

### How to set it up

**Step 1 — Get a free Gemini API key**
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **"Get API key"** → **"Create API key"**
4. Copy the generated key

**Step 2 — Create the ChatBot component**

Create the file `src/pages/client/ChatBot.tsx` and build a floating chat component that calls the Gemini API:

```typescript
const GEMINI_API_KEY = "your_api_key_here";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
```

The component should:
- Render a floating `💬` button fixed to the bottom-right of the screen
- Open a chat panel on click
- Send messages to the Gemini API with a system prompt explaining the platform
- Display responses with a typing indicator

**Step 3 — Add it to ClientLayout**

Import and add `<ChatBot />` inside `src/pages/client/ClientLayout.tsx` just before the closing tag of the return statement:

```tsx
import ChatBot from "./ChatBot";

// inside return, before </>:
<ChatBot />
```

**Step 4 — Test it**

Run the app, log in as a client, and click the `💬` button on any page. The bot should respond to questions about the platform.

> 💡 The free Gemini tier gives you **1,500 requests/day** — more than enough for development and demo purposes.

---

## Author

**Mohamed Ali Jemmali**  
Software Engineering — 2025/2026

---

<div align="center">

Built with ❤️ and a lot of ☕

</div>