# Sportly WebSocket

A real-time sports dashboard application that provides live match updates, live commentary, and match scores. The application uses WebSockets to push live updates directly to the frontend, ensuring users have the latest match information instantly.

## Features

- **Live Match Scores:** Real-time scorecard updates for ongoing matches.
- **Live Commentary Feed:** A real-time timeline of match events and commentary.
- **Match Status Indicators:** Visual cues indicating whether a match is live, upcoming, or completed.
- **Real-time Communication:** Powered by WebSockets for an instant, responsive user experience.
- **Containerized:** Fully configured with Docker and Docker Compose for easy setup and distribution.

## Tech Stack

### Frontend
- **React 19**
- **TypeScript**
- **Vite**
- **Custom Hooks** (`useWebSocket`, `useMatchData`)

### Backend
- **Node.js**
- **Express.js**
- **WebSockets** (`ws`)
- **Prisma** (ORM)
- **PostgreSQL** (Database)

### Infrastructure
- **Docker** & **Docker Compose**

## Project Structure

```text
Sportly-websocket/
├── backend/                # Node.js backend & WebSocket server
│   ├── prisma/             # Database schemas and migrations
│   ├── src/
│   │   ├── controllers/    # API endpoints
│   │   ├── routes/         # Express routing
│   │   ├── services/       # Business logic layer
│   │   └── ws/             # WebSocket server implementation
│   └── Dockerfile
├── frontend/               # React frontend App
│   ├── components/         # Reusable React components (LiveFeed, MatchCard)
│   ├── hooks/              # Data fetching and WS connection hooks
│   └── Dockerfile
└── docker-compose.yaml     # Orchestrates Database, Backend, and Frontend
```

## Getting Started

### Prerequisites
- **Docker** and **Docker Compose** installed on your machine.

### Running the Application

The easiest way to get the project running is via Docker Compose:

1. Clone the repository and navigate into the project root:
   ```bash
   cd Sportly-websocket
   ```

2. Start the services using Docker Compose:
   ```bash
   docker compose up --build -d
   ```
   *Note: This command will spin up the PostgreSQL database, run the backend database migrations, start the backend on port `8000`, and start the frontend on port `3000`.*

3. Access the application:
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8000](http://localhost:8000)

### Stopping the Application

To shut down the containers gracefully:
```bash
docker compose down
```

## How It Works

1. **Database:** The Prisma ORM manages the PostgreSQL database, storing `Matches` and `Commentaries`.
2. **REST API:** Express serves initial data (e.g., historical match data or initial load state).
3. **WebSockets:** The backend establishes a WebSocket server (`WsServer.js`) that broadcasts real-time match events and score changes. The React frontend connects to this server via the `useWebSocket` hook to automatically reflect updates on the dashboard without manual polling.
