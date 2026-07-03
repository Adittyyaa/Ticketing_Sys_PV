# PV Advisory Ticketing System

Modern ticketing system with separate frontend and backend services for efficient customer support management.

## Project Structure

```
├── frontend/          # Next.js React application (Port 3000)
├── backend/           # Node.js API server (Port 3001)
├── docker-compose.yml # Docker services configuration
└── package.json       # Root project scripts
```

## Quick Start

### Development (Both Services)
```bash
npm install
npm run install:all
npm run dev
```

### Individual Services
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### Docker Deployment
```bash
npm run docker:up
```

## Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: http://localhost:5432
- **PgAdmin**: http://localhost:5050

## Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./INCOMING-API.md)
- [PostgreSQL Setup](./POSTGRESQL_SETUP.md)