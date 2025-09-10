# URL Shortener Full Stack Application

A microservice-based URL shortener with React frontend and Node.js backend, featuring custom logging middleware.

## Project Structure

- `logging-middleware/` - Reusable logging library for both frontend and backend
- `backend/` - Node.js/Express microservice with URL shortening APIs
- `frontend/` - React application with Material UI

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, TypeScript, Material UI
- **Logging**: Custom middleware with external API integration

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Logging Middleware
The logging middleware is automatically used by both frontend and backend applications.

## API Endpoints

- `POST /shorturls` - Create shortened URL
- `GET /shorturls/:shortcode` - Get URL statistics

## Features

- URL shortening with custom shortcodes
- Configurable validity periods
- Click tracking and analytics
- Responsive Material UI interface
- Comprehensive logging system

