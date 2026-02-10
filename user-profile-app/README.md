# User Profile App - CollabCanvas

A premium user profile and settings management application built with React, Vite, and Tailwind CSS.

## Features

✨ **Premium UI Components**
- Beautiful glassmorphism design
- Smooth animations and transitions
- Dark theme with gradient effects
- Responsive layout

🎨 **User Profile Management**
- Edit profile information
- Profile banner customization
- Bio and personal details
- Avatar management

🔒 **Security Settings**
- Password management
- Two-factor authentication
- Account deletion options
- Security alerts

🔔 **Notifications**
- Email notification preferences
- Project update notifications
- Marketing email management
- Weekly digest settings

💳 **Billing & Plans**
- Plan comparison
- Subscription management
- Receipt downloads
- Payment history

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
cd user-profile-app
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5175`

### Build

```bash
npm run build
```

## Tech Stack

- **React** 19.0.0
- **Vite** 7.2.4 - Lightning fast frontend tooling
- **Tailwind CSS** 3.4.1 - Utility-first CSS framework
- **Lucide React** 0.408.0 - Beautiful icons

## Key Animations

- Fade-in effects on page transitions
- Smooth color transitions on hover
- Blob animations in background
- Toast notifications with bounce-in effect
- Scale transformations on interactive elements

## Styling Approach

The project uses Tailwind CSS for styling with custom animations defined in `tailwind.config.js`. Dark theme is implemented using Tailwind's dark mode utilities.

## Project Structure

```
src/
├── UserProfileUI.jsx    # Main component with all tabs and features
├── App.jsx              # App wrapper
├── main.jsx             # Entry point
└── index.css           # Tailwind directives and custom styles
```

## Features Highlights

### Profile Tab
- Edit profile in toggle-enabled form
- Copy email and account status
- Beautiful card layouts

### Security Tab
- Password reset with validation
- 2FA management
- Danger zone for account deletion

### Notifications Tab
- Toggle-based notification preferences
- Email and push notification settings

### Billing Tab
- Plan comparison cards
- Receipt download functionality
- Subscription management

## Performance

- Optimized animations using CSS transforms
- Lazy loading ready
- Minimal JavaScript overhead
- Fast load times with Vite

## License

MIT - Feel free to use this project for personal or commercial purposes.
