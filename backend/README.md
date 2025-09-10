# URL Shortener Backend Service

A Node.js/Express microservice that provides URL shortening functionality with analytics.

## Features

- URL shortening with custom shortcodes
- Configurable validity periods (default: 30 minutes)
- Click tracking and analytics
- Comprehensive logging integration
- Token-based authentication
- In-memory storage (suitable for evaluation)

## API Endpoints

### POST /shorturls
Create a new shortened URL.

**Request Body:**
```json
{
  "url": "https://example.com/very-long-url",
  "validity": 60,
  "shortcode": "custom123"
}
```

**Response:**
```json
{
  "shortLink": "http://localhost:5000/abc123",
  "expiry": "2025-01-01T12:00:00.000Z"
}
```

### GET /shorturls/:shortcode
Get statistics for a shortened URL.

**Response:**
```json
{
  "shortLink": "http://localhost:5000/abc123",
  "expiry": "2025-01-01T12:00:00.000Z",
  "originalUrl": "https://example.com/very-long-url",
  "creationDate": "2025-01-01T11:00:00.000Z",
  "totalClicks": 5,
  "clickData": [
    {
      "timestamp": "2025-01-01T11:30:00.000Z",
      "referrer": "https://google.com",
      "location": "US"
    }
  ]
}
```

### GET /:shortcode
Redirect to the original URL.

### GET /health
Health check endpoint.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Configuration

Update the authentication credentials in `server.js`:
- `email`: Your email address
- `name`: Your name
- `rollNo`: Your roll number
- `accessCode`: Access code from evaluation
- `clientID`: Client ID from registration
- `clientSecret`: Client secret from registration

## Logging

All operations are logged using the custom logging middleware with detailed context and error handling.
