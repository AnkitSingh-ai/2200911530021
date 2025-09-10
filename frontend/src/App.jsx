import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Tabs,
  Tab,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Link as LinkIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import UrlShortener from './components/UrlShortener';
import Statistics from './components/Statistics';
import { urlShortenerApi } from './services/api';
import { Log } from './logging-middleware';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const App = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createdUrls, setCreatedUrls] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendError, setBackendError] = useState(null);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        await urlShortenerApi.healthCheck();
        setBackendStatus('online');
        setBackendError(null);
        Log('frontend', 'info', 'component', 'Backend service is online').catch(() => {
        });
      } catch (error) {
        setBackendStatus('offline');
        setBackendError(error.message);
        Log('frontend', 'error', 'component', `Backend service is offline: ${error.message}`).catch(() => {
        });
      }
    };

    checkBackendHealth();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    Log('frontend', 'info', 'component', `Switched to tab ${newValue === 0 ? 'URL Shortener' : 'Statistics'}`).catch(() => {
    });
  };

  const handleUrlsCreated = (urls) => {
    const newUrls = urls.map(url => url.shortLink);
    setCreatedUrls(prev => [...prev, ...newUrls]);
    Log('frontend', 'info', 'component', `Added ${newUrls.length} new URLs to statistics`).catch(() => {
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <LinkIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            URL Shortener
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {backendStatus === 'checking' && <CircularProgress size={20} color="inherit" />}
            {backendStatus === 'online' && (
              <Typography variant="body2" color="inherit">
                Backend Online
              </Typography>
            )}
            {backendStatus === 'offline' && (
              <Typography variant="body2" color="inherit">
                Backend Offline
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {backendStatus === 'offline' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Backend service is unavailable: {backendError}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="URL Shortener tabs">
            <Tab
              icon={<LinkIcon />}
              label="URL Shortener"
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              icon={<AnalyticsIcon />}
              label="Statistics"
              iconPosition="start"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <UrlShortener onUrlsCreated={handleUrlsCreated} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Statistics createdUrls={createdUrls} />
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
};

export default App;