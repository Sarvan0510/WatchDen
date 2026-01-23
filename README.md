# WatchDen

A real-time Watch Party web application with synchronized video playback, chat, and screen sharing using microservices architecture.

## 📦 Tech Stack

- **Frontend:** React, TailwindCSS, Vite
- **Backend:** Spring Boot (microservices)
- **Discovery Server:** Eureka
- **Authentication:** Firebase or OAuth 2.0
- **Streaming:** WebRTC (later phase)

## 📁 Project Structure

/WatchDen
│
├── backend/
│ ├── auth-service/
│ ├── user-service/
│ ├── room-service/
│ └── ...
├── frontend/
│ └── watchden-fe/

## 🚀 Getting Started

### Backend

```bash
cd backend/[service-name]
./mvnw spring-boot:run
```

( or manually open in eclipse)

### Frontend

```bash
cd frontend/watchden-fe
npm install
npm run dev
```

For Contributing guideline check CONTRIBUTE.md
