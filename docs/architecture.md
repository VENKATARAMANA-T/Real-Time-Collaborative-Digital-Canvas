# System Architecture

```mermaid
graph TD
    Client[Web Browser Client] --> |HTTPS| Frontend[Azure Static Web Apps (React/Vite)]
    Client --> |REST API / WSS| Backend[Backend API (Docker Container)]
    
    subgraph Frontend Tier
        Frontend
    end
    
    subgraph Backend Tier
        Backend --> Node[Node.js / Express]
        Node --> Socket[Socket.io]
        Node --> WebRTC[WebRTC Signaling]
    end
    
    subgraph Data Tier
        Backend --> DB[(MongoDB Atlas)]
        Backend --> Cache[(Memory/Redis)]
    end
    
    subgraph External Services
        Backend --> Cloudinary[Cloudinary API]
        Backend --> Groq[Groq AI API]
        Backend --> SMTP[Gmail SMTP]
    end
```
