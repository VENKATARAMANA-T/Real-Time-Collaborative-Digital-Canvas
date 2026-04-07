# 🎨 Real-Time Collaborative Digital Canvas Platform

A **full-stack, real-time collaborative digital whiteboard** that allows users to create, draw, collaborate on canvases, host video meetings with shared whiteboards, chat in real time, and manage files — all in a secure, modern environment.


**VIDEO URL : https://youtu.be/0BK6py93VlA
**Live URL :** https://real-time-collaborative-digital-can.vercel.app/


Built with **React + Vite**, **Node.js/Express**, **MongoDB**, **Socket.io**, **WebRTC**, and **Cloudinary**.

---

## 🚀 Project Overview

The platform enables users to:

- Create and manage digital canvases with rich drawing tools
- Collaborate with multiple users in real time (live cursors, synced drawing)
- Host or join instant/scheduled video meetings with shared whiteboards
- Chat in real time during meetings
- Organize canvases into folders, import/export, share via link
- Get AI-powered assistance for drawing and app usage
- Track all activity in a live dashboard

---

## 🧠 Features

### 🔐 Authentication & Security
- **Email-verified registration** — stateless JWT activation link (5-min expiry) sent via email
- **JWT-based login** — access token (15m) + refresh token (7d) in httpOnly secure cookies
- **Automatic token rotation** — transparent refresh via Axios interceptor on 401 responses
- **Forgot/reset password** — secure email link with SHA-256 hashed reset tokens
- **Cross-tab sync** — activation and password reset events broadcast via Socket.io waiting rooms
- **Password hashing** — bcryptjs with salt rounds
- **Protected routes** — frontend `ProtectedRoute` guard + backend `authMiddleware` on all API routes
- **Ownership authorization** — controllers enforce user-owns-resource checks (profile, canvas, folder, uploads)
- **CORS lockdown** — production-ready origin whitelist via `FRONTEND_URL` env var
- **Restricted cookie paths** — refresh token cookie scoped to `/api/auth/refresh` only
- **Email validation** — DNS MX record lookup before sending emails to prevent bounce-backs
- **Account deletion** — cascade cleanup of all user data (canvases, folders, meetings, activity logs, notifications, Cloudinary assets)
- **No hardcoded secrets** — all JWT secrets loaded from environment variables

---

### 🏠 Dashboard
- **Canvas management** — create, rename, duplicate, delete canvases with debounced search
- **Folder management** — create, rename, delete folders; browse folder contents
- **Meeting hub** — tabbed view for Active / Upcoming / Ended meetings
- **Quick-start actions** — New Canvas, Create Meeting, Join Meeting buttons
- **Profile settings** — update username, email, profile image (face-cropped via Cloudinary)
- **Password change** and **account deletion** with verification
- **Live activity feed** — real-time updates via Socket.io
- **Notification bell** — unread badge count with mark-as-read
- **AI Bot widget** — accessible directly from dashboard

---

### 🎨 Canvas & Drawing Tools
- **Drawing tools**: Pencil, Eraser, Text, Select (move/resize/rotate), Hand (pan), Bucket Fill
- **10 shape types**: Rectangle, Circle, Triangle, Line, Star, Pentagon, Hexagon, Callout, Arrow, Rhombus
- **Stroke controls**: Width slider (1–200px), opacity, line styles
- **Fill mode toggle** — filled vs outline shapes
- **Color palette** — 20 preset colors + custom color picker for foreground and canvas background
- **Text formatting**: 8 font families, 16 font sizes, bold/italic/underline/strikethrough, left/center/right alignment
- **Layers system**: Add, delete, toggle visibility, lock, drag-reorder, opacity, background color, blend mode, rename, merge, split
- **Zoom**: 10–500% via slider, +/− buttons, and keyboard shortcuts
- **Pan**: Hand tool or modifier keys
- **Canvas background color** picker with **checkerboard transparency** toggle
- **Gridlines**, **Rulers**, and **Snap-to-grid**
- **50-step undo/redo** history
- **Copy/Cut/Paste** of elements
- **Element selection**: Move, resize, rotate, duplicate, delete (including freehand drawings)
- **AI Shape Correction** — auto-corrects freehand shapes to clean geometric forms
- **Sticky notes** — auto-expanding text with word-wrap matching between edit and display modes
- **Status bar** — cursor position (x, y), canvas dimensions, zoom level

---

### ⚡ Real-Time Collaboration
- **Socket.io WebSocket** rooms for canvas and meeting sync
- **Live cursor tracking** — colored cursors with username labels for all participants
- **Canvas operation broadcast** — all draw operations sync in real time across users
- **Server-side undo/redo stacks** per meeting (in-memory)
- **Full state sync** — late joiners receive current canvas state from server RAM (DB fallback)
- **Auto-save** — canvas auto-saves to database with 30-second debounce
- **Canvas lock** — host can lock canvas view and sync viewport for all participants
- **Emoji reactions** — broadcast animated emoji reactions to all meeting participants
- **Raise hand** — participants can raise hand to get host attention

---

### 📅 Meeting System
- **Instant meetings** — generate credentials and start immediately
- **Scheduled meetings** — create with a future start time; auto-reminder notifications
- **Join by meeting ID + password** or **join by share link** (token-based, no password needed)
- **Meeting statuses**: Pending → Live → Ended
- **Host settings**: Mute all, disable all video, toggle chat, toggle screen recording permission
- **Per-participant permissions**: View-only / Edit (host can change per-user)
- **Meeting duration timer** in footer
- **Credentials display** — meeting ID, password, share link + invite modal
- **Start / End / Leave / Cancel** meeting controls
- **Session persistence** — socket re-join across page refresh

---

### 🎥 Audio, Video & Screen Sharing (WebRTC)
- **Microphone** — echo cancellation + noise suppression
- **Camera** — 720p with mirror support
- **Peer-to-peer audio/video** via WebRTC with ICE servers
- **Screen sharing** — permission-based flow (request → host approve/decline), one sharer at a time
- **Meeting recording** — one recorder at a time, force-stop capability, uploaded to Cloudinary
- **Recording indicator** — shows recorder's name in meeting header
- **Participant video tiles** in sidebar with mic/video status indicators
- **Meeting notes page** — view chat history, playback recordings, and shared canvas link after meeting ends

---

### 💬 Chat System
- **Real-time messaging** during meetings via Socket.io
- **Chat history persistence** in MongoDB (per meeting)
- **Global chat toggle** — host can enable/disable chat for all participants
- **Per-user chat mute** — host can mute individual participants
- **Host bypass** — host always bypasses chat restrictions
- **Timestamped messages** with usernames

---

### 📁 File & Folder Management
- **Folder CRUD** — create, rename, delete folders
- **Default folder** — "Personal Sketches" auto-created on registration, protected from deletion/rename
- **Canvas organization** inside folders
- **Compound unique index** — folder names unique per owner

---

### ☁️ Media & Upload System
- **Cloudinary integration** for all media storage (images, thumbnails, recordings)
- **Base64 image upload** — typed uploads: canvas-thumbnail, canvas-image, canvas-pixel-data, profile, chat
- **Batch image upload** — up to 20 images at once
- **File upload** via Multer middleware (memory storage)
- **Recording upload** — video to Cloudinary with chunked upload for large files (>20MB)
- **Profile image** — face-cropped thumbnails (256×256, gravity: face)
- **Automatic thumbnail generation** for canvases
- **Old resource cleanup** — deletes previous Cloudinary assets on update

---

### 🤖 AI Features (RAG-Powered Bot)
- **AI chatbot** — powered by Groq SDK + LLaMA 3.3 70B model
- **RAG pipeline** — knowledge base embeddings via Xenova/all-MiniLM-L6-v2 with cosine similarity search (top-3 context retrieval)
- **Streaming responses** — real-time token-by-token display
- **17+ canvas action types** the bot can execute:
  `DRAW_SHAPE`, `DRAW_MULTIPLE`, `ARRANGE_GRID`, `ADD_TEXT`, `FILL_BACKGROUND`, `CLEAR_CANVAS`, `CHANGE_TOOL`, `CHANGE_COLOR`, `SET_STROKE_WIDTH`, `SET_FILL_MODE`, `SET_ZOOM`, `UNDO`, `REDO`, `DELETE_SELECTED`, `DUPLICATE_SELECTED`, `MOVE_SELECTED`, `RESIZE_SELECTED`, `MODIFY_SHAPES`
- **Canvas context awareness** — bot knows current canvas state (elements, selected tool, colors)
- **Few-shot learning** examples in system prompt for reliable action generation

---

### 📤 Export, Import & Sharing
- **Export canvas as JSON** file
- **Import canvas from JSON** file
- **Canvas sharing via token link** — generates unique share URL
- **Shared canvas viewer** — read-only view for anyone with the link
- **Clone shared canvas** — copy a shared canvas into your personal collection
- **File menu** with Import, Export, Share options

---

### 🔔 Notifications
- **Meeting reminder notifications** — auto-sent when a scheduled meeting is near its start time
- **Unread notification count** badge
- **Mark as read** (single) and **mark all as read** (bulk)
- **Real-time delivery** via Socket.io

---

### 📊 Activity Tracking
- **27+ tracked activity types**: canvas CRUD, folder CRUD, meeting CRUD, join/leave/end meeting, login/logout/register, profile update, password change/reset, canvas share/clone/export/import, recording upload, and more
- **Activity icons & colors** per action type
- **Activity log history** in dashboard
- **Real-time activity feed** — live updates via socket `activity_update` events

---

### 🧭 Help & Onboarding System
- **Searchable help center** (Ctrl+K shortcut)
- **Beginner / Advanced modes** (Ctrl+M toggle)
- **Guided walkthrough tours** — separate step-by-step tours for Paint editor and Dashboard with element highlighting
- **FAQ accordion**
- **Feedback form** — file upload, star rating, feedback type selection
- **Bookmarked articles** and **recently viewed** tracking
- **Video tutorials** with comments
- **Article deep linking** via URL parameters
- **Keyboard shortcuts** reference
- **Dark mode toggle** (Ctrl+Shift+D)
- **Help options floating button** — quick access to walkthrough or AI bot

---

### 🎨 UI / UX
- **Dark theme** throughout with Tailwind CSS utility-first styling
- **Responsive design**
- **Animated transitions** (CSS + JS)
- **Loading / skeleton states** — SkeletonCard components, spinners
- **Flash messages** for success/error feedback
- **Keyboard shortcuts** — Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+K (search help), Ctrl+S (save), and more
- **Custom 404 page** with go-back / home buttons
- **Auto-redirect** for unauthenticated users

---

### 🏠 Homepage / Landing Page
- **Animated hero section** with slideshow
- **Features showcase** slide
- **Call-to-action** slide
- **Background ambience** animation
- **Navigation dots** for slide control
- **Navbar** with auth modal triggers
- **Login & Register forms** in modal overlay

---

## 🚀 DevOps & CI/CD Pipeline

This project implement standard CI/CD and deployment practices.

### Infrastructure & Deployment
- **Frontend Hosting**: Azure Static Web Apps (via `.github/workflows/azure-static-web-apps.yml`).
- **Backend Containerization**: Multi-stage `Dockerfile` creating a lightweight `node:20-alpine` production image.
- **Infrastructure as Code (IaC)**: Terraform scripts (`terraform/main.tf`) to provision the Azure Resource Group and Static Web App.

### Continuous Integration (CI)
A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on all pushes and PRs to `main`, performing:
1. Frontend dependency installation, linting, and Vite build.
2. Backend dependency installation, testing, and syntax checks.
3. Multi-stage Docker image build verification.

### Branching Strategy
- `main` - Production-ready code, triggers deployments.
- `dev` - Integration branch for ongoing work.
- `feature/*` - Individual developer feature branches.

### Future Enhancements (Phase 2)
- **Monitoring & Logging**: Prometheus, Grafana, and ELK stack integration.
- **Security Scanning**: Trivy container scanning, Snyk dependency checks, and SonarQube static code analysis.

## 🏗️ System Architecture

### Frontend
- **React 18** + **Vite** (fast HMR, optimized builds)
- **Tailwind CSS** for styling
- **HTML5 Canvas** API for drawing
- **React Router** for client-side routing
- **Axios** with interceptors for API communication
- **Context API** for auth, canvas, and theme state

### Backend
- **Node.js** + **Express.js**
- **RESTful API** architecture
- **JWT authentication** (access + refresh tokens in httpOnly cookies)
- **Multer** for file upload handling

### Real-Time Layer
- **Socket.io** for WebSocket communication (canvas sync, chat, notifications, activity)
- **WebRTC** for peer-to-peer audio/video/screen sharing

### Database
- **MongoDB** with **Mongoose** ODM

### Cloud Storage
- **Cloudinary** for all media (images, thumbnails, profile pictures, recordings)

### AI / ML
- **Groq SDK** + **LLaMA 3.3 70B** for AI chatbot
- **Xenova/all-MiniLM-L6-v2** transformer for RAG embeddings
- **Custom shape detection** for AI shape correction

### Email
- **Nodemailer** via Gmail SMTP with DNS MX record validation

---

## 📂 Project Structure

```
Real-Time Collaborative Digital Canvas/
│
├── 📁 Backend/
│   │
│   ├── 📁 config/
│   │   ├── cloudinary.js                 # Cloudinary SDK config & upload helpers
│   │   └── db.js                         # MongoDB connection
│   │
│   ├── 📁 controllers/
│   │   ├── authController.js             # Register, login, logout, activate, password reset
│   │   ├── botController.js              # AI chatbot endpoint
│   │   ├── canvasController.js           # Canvas CRUD, share, clone, import/export
│   │   ├── chatController.js             # Chat history, toggle global/user chat
│   │   ├── folderController.js           # Folder CRUD, folder canvases
│   │   ├── meetingController.js          # Meeting CRUD, join, leave, recording upload
│   │   ├── uploadController.js           # Image/file/recording upload, Cloudinary delete
│   │   └── userController.js             # Profile update, password change, activity logs, account delete
│   │
│   ├── 📁 data/
│   │   └── knowledge_base.json           # RAG knowledge base for AI bot
│   │
│   ├── 📁 middleware/
│   │   ├── authMiddleware.js             # JWT token verification
│   │   ├── errorMiddleware.js            # 404 & global error handler
│   │   ├── roleMiddleware.js             # Role-based access (placeholder)
│   │   └── uploadMiddleware.js           # Multer file upload config
│   │
│   ├── 📁 models/
│   │   ├── ActivityLog.js                # User activity tracking schema
│   │   ├── Canvas.js                     # Canvas data & metadata schema
│   │   ├── Chat.js                       # Chat message schema
│   │   ├── Folder.js                     # Folder organization schema
│   │   ├── Meeting.js                    # Meeting config & participants schema
│   │   ├── Notification.js               # User notification schema
│   │   └── User.js                       # User account schema
│   │
│   ├── 📁 routes/
│   │   ├── authRoutes.js                 # /api/auth/*
│   │   ├── botRoutes.js                  # /api/bot/*
│   │   ├── canvasRoutes.js               # /api/canvases/*
│   │   ├── chatRoutes.js                 # /api/chat/*
│   │   ├── folderRoutes.js               # /api/folders/*
│   │   ├── meetingRoutes.js              # /api/meetings/*
│   │   ├── notificationRoutes.js         # /api/notifications/*
│   │   ├── uploadRoutes.js               # /api/upload/*
│   │   └── userRoutes.js                 # /api/users/*
│   │
│   ├── 📁 services/
│   │   └── RAGService.js                 # RAG pipeline: embeddings, similarity search, streaming
│   │
│   ├── 📁 socket/
│   │   ├── canvasSocket.js               # Real-time canvas sync events
│   │   ├── chatSocket.js                 # Real-time chat events
│   │   └── socketHandler.js              # Socket.io connection manager & meeting events
│   │
│   ├── 📁 uploads/
│   │   └── 📁 recordings/               # (Legacy) local recording storage
│   │
│   ├── 📁 utils/
│   │   ├── emailService.js              # Nodemailer + DNS MX validation
│   │   └── tokenService.js              # JWT sign/verify, cookie helpers
│   │
│   ├── server.js                         # Express app entry point
│   ├── package.json                      # Backend dependencies
│   └── .env                              # Environment variables
│
├── 📁 Frontend/
│   │
│   ├── 📁 public/                        # Static assets
│   │
│   ├── 📁 src/
│   │   │
│   │   ├── 📁 components/
│   │   │   │
│   │   │   ├── 📁 Bot/
│   │   │   │   ├── BotWidget.jsx         # AI chatbot floating widget
│   │   │   │   └── BotWidget.css         # Bot widget styles
│   │   │   │
│   │   │   ├── 📁 Canvas/
│   │   │   │   ├── ColorPalette.jsx      # Color picker & palette
│   │   │   │   ├── LayerPanel.jsx        # Layer management panel
│   │   │   │   ├── PaintCanvas.jsx       # Main canvas rendering component
│   │   │   │   ├── PaintWalkthrough.jsx  # Guided tour for paint editor
│   │   │   │   ├── PropertiesPanel.jsx   # Element properties editor
│   │   │   │   ├── ShapesPanel.jsx       # Shape tool selector
│   │   │   │   ├── StatusBar.jsx         # Cursor position, zoom, dimensions
│   │   │   │   ├── TextFormatting.jsx    # Text font, size, style controls
│   │   │   │   ├── Toolbar.jsx           # Drawing tools sidebar
│   │   │   │   ├── TopMenu.jsx           # File menu (import/export/share)
│   │   │   │   └── ViewControls.jsx      # Zoom, grid, ruler, snap controls
│   │   │   │
│   │   │   ├── 📁 Collaboration/
│   │   │   │   ├── ChatBox.jsx           # Real-time meeting chat
│   │   │   │   ├── Cursors.jsx           # Live cursor tracking overlay
│   │   │   │   ├── UserList.jsx          # Online participants list
│   │   │   │   └── VideoChat.jsx         # WebRTC video/audio UI
│   │   │   │
│   │   │   ├── 📁 Dashboard/
│   │   │   │   ├── CanvasCard.jsx        # Canvas thumbnail card
│   │   │   │   ├── DashboardWalkthrough.jsx  # Guided tour for dashboard
│   │   │   │   ├── FileExplorer.jsx      # Folder & canvas tree browser
│   │   │   │   └── HistoryModal.jsx      # Activity history modal
│   │   │   │
│   │   │   ├── 📁 help_features/
│   │   │   │   ├── ArticleGrid.jsx       # Help article grid display
│   │   │   │   ├── FeedbackModal.jsx     # User feedback form modal
│   │   │   │   └── SearchBar.jsx         # Help system search
│   │   │   │
│   │   │   ├── 📁 help_layout/
│   │   │   │   ├── Header.jsx            # Help page header
│   │   │   │   ├── SkeletonCard.jsx      # Loading skeleton placeholder
│   │   │   │   └── Tooltip.jsx           # Contextual tooltip
│   │   │   │
│   │   │   ├── 📁 HomePage/
│   │   │   │   ├── AuthModal.jsx         # Login/Register modal wrapper
│   │   │   │   ├── BackgroundAmbience.jsx # Animated background effect
│   │   │   │   ├── CollabCanvasApp.jsx   # Homepage root component
│   │   │   │   ├── CTASlide.jsx          # Call-to-action slide
│   │   │   │   ├── FeaturesSlide.jsx     # Features showcase slide
│   │   │   │   ├── HeroSlide.jsx         # Hero section slide
│   │   │   │   ├── LoginForm.jsx         # Login form
│   │   │   │   ├── Navbar.jsx            # Homepage navigation bar
│   │   │   │   ├── NavDots.jsx           # Slide navigation dots
│   │   │   │   ├── RegisterForm.jsx      # Registration form
│   │   │   │   └── utils.js              # Homepage utility functions
│   │   │   │
│   │   │   ├── 📁 Meeting/
│   │   │   │   ├── Canvas.jsx            # Meeting whiteboard canvas
│   │   │   │   ├── Footer.jsx            # Meeting controls footer
│   │   │   │   ├── Header.jsx            # Meeting info header
│   │   │   │   ├── InviteModal.jsx       # Meeting invite/share modal
│   │   │   │   ├── ScreenShareRequests.jsx # Screen share permission dialog
│   │   │   │   ├── Sidebar.jsx           # Participant list & video sidebar
│   │   │   │   ├── Toolbar.jsx           # Meeting canvas toolbar
│   │   │   │   ├── ToolSettings.jsx      # Brush/shape settings panel
│   │   │   │   ├── UserNotification.jsx  # In-meeting notification toast
│   │   │   │   └── VideoPlayer.jsx       # WebRTC video tile
│   │   │   │
│   │   │   ├── 📁 shared/
│   │   │   │   ├── HelpOptionsButton.jsx # Floating help quick-access button
│   │   │   │   ├── IconButton.jsx        # Reusable icon button
│   │   │   │   ├── MenuItem.jsx          # Reusable menu item
│   │   │   │   └── Section.jsx           # Reusable section wrapper
│   │   │   │
│   │   │   └── ProtectedRoute.jsx        # Auth guard for private routes
│   │   │
│   │   ├── 📁 context/
│   │   │   ├── AuthContext.jsx           # Authentication state & methods
│   │   │   ├── CanvasContext.jsx         # Canvas state management
│   │   │   └── ThemeContext.jsx          # Dark/light theme toggle
│   │   │
│   │   ├── 📁 data/
│   │   │   └── helpData.js              # Help articles, FAQs, shortcuts data
│   │   │
│   │   ├── 📁 hooks/
│   │   │   ├── useAudioStream.js        # Audio stream management
│   │   │   ├── useAudioStream_new.js    # Updated audio stream hook
│   │   │   ├── useAutoSave.js           # Canvas auto-save (30s debounce)
│   │   │   ├── useCanEdit.js            # Edit permission check
│   │   │   ├── useDraw.js              # Core drawing logic
│   │   │   ├── usePaintHistory.js       # 50-step undo/redo history
│   │   │   ├── usePaintTools.js         # Tool state management
│   │   │   └── useSocket.js             # Socket.io connection hook
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── ActivateAccount.jsx      # Email activation page
│   │   │   ├── Dashboard.jsx            # Main dashboard page
│   │   │   ├── HelpSystemUI.jsx         # Help center page
│   │   │   ├── JoinByLink.jsx           # Join meeting via share link
│   │   │   ├── Meeting.jsx              # Meeting room page
│   │   │   ├── meeting.css              # Meeting page styles
│   │   │   ├── MeetingCanvasEditor.jsx  # Full-screen meeting canvas editor
│   │   │   ├── MeetingNotes.jsx         # Post-meeting notes & recordings
│   │   │   ├── NotFoundWindow.jsx       # Custom 404 page
│   │   │   ├── PaintApp.jsx             # Standalone canvas editor page
│   │   │   ├── ResetPassword.jsx        # Password reset page
│   │   │   └── SharedCanvas.jsx         # Read-only shared canvas viewer
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── api.js                   # Axios instance, interceptors, all API endpoints
│   │   │   └── exportService.js         # Canvas export helpers
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── canvasHelpers.js         # Canvas utility functions
│   │   │   └── shapeDetection.js        # AI shape recognition logic
│   │   │
│   │   ├── App.jsx                      # Root component with route definitions
│   │   ├── App.css                      # Global app styles
│   │   ├── main.jsx                     # React entry point
│   │   └── index.css                    # Base CSS / Tailwind imports
│   │
│   ├── index.html                        # HTML entry point
│   ├── package.json                      # Frontend dependencies
│   ├── vite.config.js                    # Vite configuration
│   ├── tailwind.config.js                # Tailwind CSS configuration
│   ├── postcss.config.js                 # PostCSS configuration
│   └── eslint.config.js                  # ESLint configuration
│
└── README.md                             # Project documentation
```

---

## ⚙️ Environment Variables

### Backend (`.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/Real_Time_Collaborative_Digital_Canvas
JWT_SECRET=your_jwt_secret
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail App Password (for email)
- Groq API key (for AI bot)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Real-Time-Collaborative-Digital-Canvas

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### Running the Application

```bash
# Start backend (from Backend/)
npm start

# Start frontend (from Frontend/)
npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:5173`.

---






