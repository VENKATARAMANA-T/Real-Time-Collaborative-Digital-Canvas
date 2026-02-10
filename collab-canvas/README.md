# CollabCanvas - Infinite Canvas for Teams

A modern, premium landing page and dashboard application for a collaborative digital canvas platform. Built with React, Vite, and Tailwind CSS.

## Features

✨ **Premium Landing Page**
- Hero section with animated canvas
- Features showcase with cards
- Call-to-action sections
- Smooth scroll navigation
- Particle effects background

🎨 **Modern UI Components**
- Glassmorphism design
- Premium animations and transitions
- Dark theme with gradient accents
- Responsive layout for all devices
- Interactive buttons and hover effects

🔐 **Authentication System**
- Login/Register modals
- Form validation
- Loading states
- Error handling
- Toast notifications

📊 **User Dashboard**
- Welcome section
- Statistics cards with trends
- Recent projects showcase
- User profile management
- Real-time status indicator

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
cd collab-canvas
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5176`

### Build

```bash
npm run build
```

## Tech Stack

- **React** 19.0.0
- **Vite** 7.2.4 - Next generation frontend tooling
- **Tailwind CSS** 3.4.1 - Utility-first CSS framework
- **Lucide React** 0.408.0 - Beautiful icons

## Key Features

### Landing Page (Multiple Slides)

1. **Hero Slide**
   - Animated canvas visualization
   - Call-to-action buttons
   - Social proof with user avatars
   - Scroll-to-explore indication

2. **Features Slide**
   - Real-time Sync capabilities
   - AI Copilot features
   - Enterprise security
   - Interactive cards with hover effects

3. **CTA Slide**
   - Sign-up incentive
   - Trust signals
   - Final conversion button

### Authentication
- Flip animation between login and register
- Form validation
- Input error messages
- Loading states

### Dashboard
- Statistics dashboard with 4 key metrics
- Recent projects grid
- User greeting
- Project management interface

## Animations

- **Fade-in**: Smooth appearance of elements
- **Fade-up**: Elements sliding up while appearing
- **Scale-in**: Elements scaling from small to full size
- **Bounce**: Subtle bouncing animations
- **Float**: Floating motion effects
- **Blob**: Smooth blob shape animations in background
- **Bounce-in**: Toast notifications with bounce effect

## Project Structure

```
src/
├── App.jsx          # Main component with all sections
├── main.jsx         # Entry point
└── index.css       # Tailwind directives and custom styles
```

## Performance Optimizations

- CSS-based animations (GPU accelerated)
- Minimal JavaScript overhead
- Optimized particle system
- Fast canvas rendering
- Smooth transitions with hardware acceleration

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Customization

### Colors
Edit `tailwind.config.js` to customize color scheme:
- Purple: Primary accent
- Cyan: Secondary accent
- Orange: Tertiary accent

### Animation Timing
Modify animation durations in CSS `@keyframes` in `App.jsx` and `tailwind.config.js`

### Content
Update text, images, and features in the respective slide sections

## License

MIT - Free to use for personal and commercial projects.

## Support

For issues or feature requests, please create an issue in the repository.
