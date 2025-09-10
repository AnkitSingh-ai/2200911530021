import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { urlShortenerApi } from '../services/api';
import { Log } from '../logging-middleware';

const UrlShortener = ({ onUrlsCreated }) => {
  const [urls, setUrls] = useState([
    { url: '', validity: '30', shortcode: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createdUrls, setCreatedUrls] = useState([]);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidValidity = (validity) => {
    const num = parseInt(validity);
    return !isNaN(num) && num > 0;
  };

  const isValidShortcode = (shortcode) => {
    if (!shortcode) return true;
    return /^[a-zA-Z0-9]{3,20}$/.test(shortcode);
  };

  const hasDuplicateShortcodes = () => {
    const shortcodes = urls
      .map(u => u.shortcode.trim())
      .filter(s => s.length > 0);
    return new Set(shortcodes).size !== shortcodes.length;
  };

  const addUrlForm = () => {
    if (urls.length < 5) {
      setUrls([...urls, { url: '', validity: '30', shortcode: '' }]);
      Log('frontend', 'info', 'component', `Added new URL form. Total forms: ${urls.length + 1}`).catch(() => {});
    }
  };

  const removeUrlForm = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
      Log('frontend', 'info', 'component', `Removed URL form at index ${index}. Remaining forms: ${newUrls.length}`).catch(() => {});
    }
  };

  const updateUrlForm = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index] = { ...newUrls[index], [field]: value };
    setUrls(newUrls);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      Log('frontend', 'info', 'component', 'Copied URL to clipboard').catch(() => {});
    } catch (error) {
      Log('frontend', 'error', 'component', 'Failed to copy to clipboard').catch(() => {});
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const validationErrors = [];

      urls.forEach((urlData, index) => {
        if (!urlData.url.trim()) {
          validationErrors.push(`URL ${index + 1}: URL is required`);
        } else if (!isValidUrl(urlData.url)) {
          validationErrors.push(`URL ${index + 1}: Invalid URL format`);
        }

        if (urlData.validity && !isValidValidity(urlData.validity)) {
          validationErrors.push(`URL ${index + 1}: Validity must be a positive number`);
        }

        if (urlData.shortcode && !isValidShortcode(urlData.shortcode)) {
          validationErrors.push(`URL ${index + 1}: Shortcode must be 3-20 alphanumeric characters`);
        }
      });

      if (hasDuplicateShortcodes()) {
        validationErrors.push('Duplicate shortcodes are not allowed');
      }

      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        Log('frontend', 'warn', 'component', `Form validation failed: ${validationErrors.join(', ')}`).catch(() => {});
        return;
      }

      const promises = urls
        .filter(urlData => urlData.url.trim())
        .map(async (urlData) => {
          const requestData = {
            url: urlData.url.trim(),
            validity: urlData.validity ? parseInt(urlData.validity) : undefined,
            shortcode: urlData.shortcode.trim() || undefined,
          };

          return urlShortenerApi.createShortUrl(requestData);
        });

      const results = await Promise.all(promises);
      setCreatedUrls(results);
      onUrlsCreated(results);

      setSuccess(`Successfully created ${results.length} shortened URL(s)`);
      Log('frontend', 'info', 'component', `Successfully created ${results.length} shortened URLs`).catch(() => {});

      setUrls([{ url: '', validity: '30', shortcode: '' }]);

    } catch (error) {
      setError(error.message || 'Failed to create shortened URLs');
      Log('frontend', 'error', 'component', `Failed to create shortened URLs: ${error.message}`).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <LinkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        URL Shortener
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create up to 5 shortened URLs at once. All fields except URL are optional.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2}>
        {urls.map((urlData, index) => (
          <Grid item xs={12} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    URL {index + 1}
                  </Typography>
                  {urls.length > 1 && (
                    <IconButton
                      color="error"
                      onClick={() => removeUrlForm(index)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Long URL *"
                      value={urlData.url}
                      onChange={(e) => updateUrlForm(index, 'url', e.target.value)}
                      placeholder="https://example.com/very-long-url"
                      error={!!(urlData.url && !isValidUrl(urlData.url))}
                      helperText={urlData.url && !isValidUrl(urlData.url) ? 'Invalid URL format' : ''}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Validity (minutes)"
                      type="number"
                      value={urlData.validity}
                      onChange={(e) => updateUrlForm(index, 'validity', e.target.value)}
                      placeholder="30"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Custom Shortcode"
                      value={urlData.shortcode}
                      onChange={(e) => updateUrlForm(index, 'shortcode', e.target.value)}
                      placeholder="mycode123"
                      error={!!(urlData.shortcode && !isValidShortcode(urlData.shortcode))}
                      helperText={urlData.shortcode && !isValidShortcode(urlData.shortcode) ? '3-20 alphanumeric characters' : ''}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addUrlForm}
          disabled={urls.length >= 5}
        >
          Add URL ({urls.length}/5)
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || urls.every(u => !u.url.trim())}
          startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
        >
          {loading ? 'Creating...' : 'Create Short URLs'}
        </Button>
      </Box>

      {createdUrls.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Created URLs
          </Typography>
          <Grid container spacing={2}>
            {createdUrls.map((url, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Expires: {new Date(url.expiry).toLocaleString()}
                        </Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                          {url.shortLink}
                        </Typography>
                      </Box>
                      <Tooltip title="Copy URL">
                        <IconButton
                          onClick={() => copyToClipboard(url.shortLink)}
                          size="small"
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default UrlShortener;