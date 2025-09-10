# Logging Middleware

A reusable logging library for both frontend and backend applications that sends structured logs to an external API.

## Features

- Structured logging with validation
- Support for both backend and frontend packages
- Async and sync logging options
- Comprehensive error handling
- Token-based authentication support

## Usage

### Basic Usage

```javascript
const { Log, LogSync } = require('./logging-middleware');

// Async logging
await Log('backend', 'info', 'service', 'User authentication successful');

// Sync logging (fire and forget)
LogSync('frontend', 'error', 'component', 'Failed to load user data');
```

### With Authentication Token

```javascript
const authToken = 'your-jwt-token';
await Log('backend', 'info', 'auth', 'User logged in successfully', authToken);
```

## Valid Parameters

### Stack
- `backend` - For backend applications
- `frontend` - For frontend applications

### Level
- `debug` - Debug information
- `info` - General information
- `warn` - Warning messages
- `error` - Error conditions
- `fatal` - Fatal errors

### Package (Backend Only)
- `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`

### Package (Frontend Only)
- `api`, `component`, `hook`, `page`, `state`, `style`

### Package (Shared)
- `auth`, `config`, `middleware`, `utils`

## API Integration

The middleware sends logs to: `http://20.244.56.144/evaluation-service/logs`

## Error Handling

- Validates all parameters before sending
- Falls back to console logging if API is unavailable
- Provides detailed error messages for invalid parameters
