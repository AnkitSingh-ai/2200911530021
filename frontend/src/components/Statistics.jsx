import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ExpandMore as ExpandMoreIcon,
  Analytics as AnalyticsIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { urlShortenerApi } from '../services/api';
import { Log } from '../logging-middleware';

const Statistics = ({ createdUrls }) => {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getShortcodeFromUrl = (url) => {
    const match = url.match(/\/([^/]+)$/);
    return match ? match[1] : '';
  };

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const shortcodes = createdUrls.map(getShortcodeFromUrl).filter(Boolean);
      
      if (shortcodes.length === 0) {
        setStatistics([]);
        return;
      }

      const promises = shortcodes.map(async (shortcode) => {
        try {
          return await urlShortenerApi.getUrlStatistics(shortcode);
        } catch (error) {
          Log('frontend', 'warn', 'api', `Failed to load statistics for ${shortcode}: ${error.message}`).catch(() => {});
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((result) => result !== null);
      
      setStatistics(validResults);
      Log('frontend', 'info', 'component', `Loaded statistics for ${validResults.length} URLs`).catch(() => {});
    } catch (error) {
      setError(error.message || 'Failed to load statistics');
      Log('frontend', 'error', 'component', `Failed to load statistics: ${error.message}`).catch(() => {});
    } finally {
      setLoading(false);
    }
  }, [createdUrls]);

  useEffect(() => {
    if (createdUrls.length > 0) {
      loadStatistics();
    }
  }, [createdUrls, loadStatistics]);

  const filteredStatistics = statistics.filter(stat => 
    stat.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stat.shortLink.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiryString) => {
    return new Date(expiryString) < new Date();
  };

  const getStatusColor = (expiryString) => {
    if (isExpired(expiryString)) return 'error';
    return 'success';
  };

  const getStatusText = (expiryString) => {
    if (isExpired(expiryString)) return 'Expired';
    return 'Active';
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">
          <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          URL Statistics
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadStatistics}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {createdUrls.length === 0 && (
        <Alert severity="info">
          No URLs have been created yet. Create some URLs first to view statistics.
        </Alert>
      )}

      {createdUrls.length > 0 && (
        <>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <TextField
              label="Search URLs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 300 }}
            />
            <Chip
              label={`${filteredStatistics.length} URL(s)`}
              color="primary"
              variant="outlined"
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {!loading && filteredStatistics.length === 0 && searchTerm && (
            <Alert severity="info">
              No URLs match your search criteria.
            </Alert>
          )}

          {!loading && filteredStatistics.length > 0 && (
            <Grid container spacing={3}>
              {filteredStatistics.map((stat, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinkIcon color="primary" />
                          <Typography variant="h6">
                            {getShortcodeFromUrl(stat.shortLink)}
                          </Typography>
                          <Chip
                            label={getStatusText(stat.expiry)}
                            color={getStatusColor(stat.expiry)}
                            size="small"
                          />
                        </Box>
                        <Chip
                          label={`${stat.totalClicks} clicks`}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        <strong>Original URL:</strong> {stat.originalUrl}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Created:</strong> {formatDate(stat.creationDate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Expires:</strong> {formatDate(stat.expiry)}
                          </Typography>
                        </Grid>
                      </Grid>

                      {stat.totalClicks > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">
                              Click Details ({stat.totalClicks} clicks)
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <TimeIcon fontSize="small" />
                                        Timestamp
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <LanguageIcon fontSize="small" />
                                        Referrer
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <LocationIcon fontSize="small" />
                                        Location
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {stat.clickData.map((click, clickIndex) => (
                                    <TableRow key={clickIndex}>
                                      <TableCell>
                                        {formatDate(click.timestamp)}
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            maxWidth: 200,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}
                                          title={click.referrer}
                                        >
                                          {click.referrer}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={click.location}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {stat.totalClicks === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          No clicks recorded yet.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default Statistics;