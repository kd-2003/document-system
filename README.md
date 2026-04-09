# Async Document Processing Workflow System

A full-stack application for asynchronous document processing with real-time progress tracking.

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Queue**: Redis + Bull
- **Real-time**: Socket.IO
- **Queue**: Redis + Bull

## Features

- Upload multiple documents
- Asynchronous background processing
- Real-time progress tracking
- Document review and editing
- Export finalized results (JSON/CSV)
- Job retry for failed processes
- Dashboard with search, filter, and sorting

## Project Structure

```
document-processing/
├── backend/                 # Node.js/Express API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── workers/            # Background job processors
│   ├── middleware/         # Express middleware
│   ├── config/             # Configuration files
│   └── server.js           # Main server file
├── frontend/                # React + Vite application
│   ├── index.html          # Main HTML file
│   ├── vite.config.js      # Vite configuration
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- MongoDB
- Redis (for queue management)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/document-processing
   REDIS_URL=redis://localhost:6379
   UPLOAD_DIR=uploads/
   ```

5. Start the server:
   ```bash
   node server.js
   ```

The backend will be available at `http://localhost:3001`.

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000` and will proxy API requests to the backend.

## API Endpoints

- `POST /api/documents/upload` - Upload documents
- `GET /api/documents` - List all documents/jobs
- `GET /api/documents/:id` - Get document details
- `POST /api/documents/:id/retry` - Retry failed job
- `PUT /api/documents/:id/review` - Update reviewed result
- `POST /api/documents/:id/finalize` - Finalize result
- `GET /api/documents/:id/export/:format` - Export results

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## License

ISC