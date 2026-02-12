# 🎨 Real-Time Collaborative Digital Canvas Platform

A **real-time, collaborative digital whiteboard and canvas platform** that allows users to create, edit, manage, and collaborate on canvases, host and join meetings, and track activity — all in a secure, scalable environment.

This project is designed as a **full-stack system** with real-time synchronization, rich drawing tools, file management, and user-centric collaboration features.

---

## 🚀 Project Overview

The platform enables users to:
- Create and manage digital canvases
- Draw freehand, shapes, text, and diagrams
- Collaborate with multiple users in real time
- Schedule or instantly join meetings
- Import, export, rename, and organize canvases
- Track activity and version history
- Learn and explore features through guided assistance

The system follows **modern software engineering practices**, including:
- Modular frontend and backend architecture
- Feature-based Git workflow
- UML-based system design
- API-driven integration
- Real-time communication using WebSockets

---

## 🧠 Core Features

### 🔐 Authentication & User Management
- Create new user accounts
- Secure login with JWT-based authentication
- Forgot password and password reset flow
- Session handling and logout
- Role-based access control (Admin / Editor / Viewer)
- Account management and deletion

---

### 🏠 Dashboard
A centralized workspace providing access to:
- Home
- My Canvases
- Meetings
- Notifications
- Activity
- Settings

Each section is designed to be **independent, reusable, and API-driven**.

---

### 🎨 Canvas Management
- Create new canvases
- Open existing canvases
- Rename canvases
- Import canvases
- Export canvases (JSON / Image formats)
- Organize canvases into folders
- Private, shared, and recent canvases
- Version history and time-lapse replay

---

### ✏️ Drawing & Editing Tools
- Freehand drawing
- Shapes (rectangle, circle, line, etc.)
- Text tool
- Color picker
- Brush size controls
- Layers (add, hide, lock, reorder)
- Undo / Redo
- Infinite canvas support
- AI-assisted shape correction

---

### ⚡ Real-Time Collaboration
- Multi-user editing on the same canvas
- Real-time cursor tracking
- Live updates using WebSockets
- Conflict-free synchronization using CRDT / OT
- Offline editing and auto-merge on reconnect
- Presence indicators for collaborators

---

### 📅 Meetings & Collaboration Rooms
- Create instant or scheduled meetings
- Join meetings using room IDs
- Host-managed collaboration rooms
- Canvas sharing during meetings
- Real-time collaboration inside rooms

---

### 🔔 Notifications
- Meeting invitations
- Meeting reminders
- Collaboration alerts
- System updates

---

### 📊 Activity Tracking
- Login history
- Canvas creation and deletion logs
- Canvas updates and edits
- Collaboration activity logs

---

### ⚙️ Settings & User Preferences
- Update profile details
- Change password
- Manage account details
- Delete account
- Enable beginner / advanced modes
- Dark / light theme toggle

---

### 🧭 User Assistance & Learning
- In-app help center
- Guided walkthroughs
- Contextual tooltips
- Keyboard shortcut hints
- Feedback submission
- Beginner-friendly onboarding

---

## 🏗️ System Architecture

### Frontend
- React.js / Next.js
- Tailwind CSS
- HTML5 Canvas
- Component-based architecture
- API-driven state management

### Backend
- Node.js
- Express.js
- RESTful APIs
- JWT Authentication

### Real-Time Layer
- WebSockets (Socket.IO)
- CRDT / OT algorithms

### Database
- MongoDB / Firebase Firestore

### Storage
- AWS S3 / Firebase Storage

### AI & ML
- TensorFlow.js
- Shape recognition and correction

### DevOps & Deployment
- Docker
- AWS / Vercel
- GitHub for version control

---

## 🧩 UML & Design Artifacts

This project includes:
- **UML Activity Diagram**
- Component hierarchy documentation
- API contract definitions
- Feature-based development workflow

The activity diagram models:
- Landing page and authentication flow
- Dashboard navigation
- Canvas creation and collaboration
- Meetings and notifications
- Settings and logout

---

## 🌿 Git Workflow

The project follows a **feature-branch workflow**:

```bash
main
 ├── dev
 │    ├── feature/rename-import-export
 │    ├── feature/canvas-tools
 │    └── feature/meetings
