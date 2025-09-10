const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const { Log, LogSync } = require('../logging-middleware');

const safeLog = async (stack, level, packageName, message, authToken = null) => {
  try {
    await Log(stack, level, packageName, message, authToken);
  } catch (error) {
    console.log(`[${level.toUpperCase()}] ${packageName}: ${message}`);
  }
};

const safeLogSync = (stack, level, packageName, message, authToken = null) => {
  try {
    LogSync(stack, level, packageName, message, authToken);
  } catch (error) {
    console.log(`[${level.toUpperCase()}] ${packageName}: ${message}`);
  }
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

const urlStore = new Map();
const clickData = new Map();

const AUTH_API_URL = 'http://20.244.56.144/evaluation-service/auth';
let authToken = null;
let tokenExpiry = null;

async function getAuthToken() {
  try {
    if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
      return authToken;
    }

    const authData = {
      email: "devathaku33@gmail.com",
      name: "ankit singh",
      rollNo: "2200911530021",
      accessCode: "NWktBu",
      clientID: "65d91606-c127-49a4-b6b8-99bd9982fb78",
      clientSecret: "zammvQykyNHvVrQp"
    };

    const response = await axios.post(AUTH_API_URL, authData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.access_token) {
      authToken = response.data.access_token;
      tokenExpiry = response.data.expires_in * 1000;
      
      await safeLog('backend', 'info', 'auth', 'Successfully obtained authentication token', authToken);
      return authToken;
    }
  } catch (error) {
    safeLogSync('backend', 'error', 'auth', `Failed to obtain authentication token: ${error.message}`);
    throw error;
  }
}

function generateShortcode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function getClientIP(req) {
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
}

function getReferrer(req) {
  return req.get('Referer') || req.get('Referrer') || 'Direct';
}

function getLocation(ip) {
  const locations = ['US', 'IN', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP'];
  return locations[Math.floor(Math.random() * locations.length)];
}

app.get('/health', async (req, res) => {
  try {
    safeLogSync('backend', 'info', 'route', 'Health check endpoint accessed');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  } catch (error) {
    safeLogSync('backend', 'error', 'route', `Health check failed: ${error.message}`);
    res.status(500).json({ error: 'Health check failed' });
  }
});

app.post('/shorturls', async (req, res) => {
  try {
    const { url, validity = 30, shortcode } = req.body;

    if (!url) {
      await safeLog('backend', 'warn', 'handler', 'POST /shorturls: Missing URL parameter');
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidUrl(url)) {
      await safeLog('backend', 'warn', 'handler', `POST /shorturls: Invalid URL format: ${url}`);
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (validity && (typeof validity !== 'number' || validity <= 0)) {
      await safeLog('backend', 'warn', 'handler', `POST /shorturls: Invalid validity: ${validity}`);
      return res.status(400).json({ error: 'Validity must be a positive number' });
    }

    let finalShortcode = shortcode;
    if (shortcode) {
      if (urlStore.has(shortcode)) {
        await safeLog('backend', 'warn', 'handler', `POST /shorturls: Shortcode collision: ${shortcode}`);
        return res.status(409).json({ error: 'Shortcode already exists' });
      }
    } else {
      do {
        finalShortcode = generateShortcode();
      } while (urlStore.has(finalShortcode));
    }

    const expiryTime = new Date(Date.now() + validity * 60 * 1000);

    const urlData = {
      id: uuidv4(),
      originalUrl: url,
      shortcode: finalShortcode,
      createdAt: new Date(),
      expiresAt: expiryTime,
      validity: validity
    };

    urlStore.set(finalShortcode, urlData);
    clickData.set(finalShortcode, []);

    await safeLog('backend', 'info', 'service', `URL shortened successfully: ${url} -> ${finalShortcode}`);

    res.status(201).json({
      shortLink: `http://localhost:${PORT}/${finalShortcode}`,
      expiry: expiryTime.toISOString()
    });

  } catch (error) {
    await safeLog('backend', 'error', 'handler', `POST /shorturls error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/shorturls/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;

    if (!urlStore.has(shortcode)) {
      await safeLog('backend', 'warn', 'handler', `GET /shorturls/${shortcode}: Shortcode not found`);
      return res.status(404).json({ error: 'Shortcode not found' });
    }

    const urlData = urlStore.get(shortcode);
    const clicks = clickData.get(shortcode) || [];

    if (new Date() > urlData.expiresAt) {
      await safeLog('backend', 'warn', 'handler', `GET /shorturls/${shortcode}: URL has expired`);
      return res.status(410).json({ error: 'URL has expired' });
    }

    await safeLog('backend', 'info', 'service', `Statistics retrieved for shortcode: ${shortcode}`);

    res.json({
      shortLink: `http://localhost:${PORT}/${shortcode}`,
      expiry: urlData.expiresAt.toISOString(),
      originalUrl: urlData.originalUrl,
      creationDate: urlData.createdAt.toISOString(),
      totalClicks: clicks.length,
      clickData: clicks
    });

  } catch (error) {
    await safeLog('backend', 'error', 'handler', `GET /shorturls/${shortcode} error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;

    if (!urlStore.has(shortcode)) {
      await safeLog('backend', 'warn', 'handler', `GET /${shortcode}: Shortcode not found`);
      return res.status(404).json({ error: 'Shortcode not found' });
    }

    const urlData = urlStore.get(shortcode);

    if (new Date() > urlData.expiresAt) {
      await safeLog('backend', 'warn', 'handler', `GET /${shortcode}: URL has expired`);
      return res.status(410).json({ error: 'URL has expired' });
    }

    const clickInfo = {
      timestamp: new Date().toISOString(),
      referrer: getReferrer(req),
      location: getLocation(getClientIP(req))
    };

    const clicks = clickData.get(shortcode) || [];
    clicks.push(clickInfo);
    clickData.set(shortcode, clicks);

    await safeLog('backend', 'info', 'service', `URL accessed: ${shortcode} -> ${urlData.originalUrl}`);

    res.redirect(302, urlData.originalUrl);

  } catch (error) {
    await safeLog('backend', 'error', 'handler', `GET /${shortcode} error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((error, req, res, next) => {
  safeLogSync('backend', 'error', 'middleware', `Unhandled error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  safeLogSync('backend', 'warn', 'route', `404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  try {
    await safeLog('backend', 'info', 'service', `Server started on port ${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.log(`Server running on http://localhost:${PORT} (logging service unavailable)`);
  }
});

process.on('SIGTERM', async () => {
  await safeLog('backend', 'info', 'service', 'Server shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  await safeLog('backend', 'info', 'service', 'Server shutting down gracefully');
  process.exit(0);
});