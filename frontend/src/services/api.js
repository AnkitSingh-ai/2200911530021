import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const urlShortenerApi = {
  createShortUrl: async (data) => {
    try {
      const response = await api.post('/shorturls', data);
      return response.data;
    } catch (error) {
      const apiError = error.response?.data || { error: 'Network error' };
      throw new Error(apiError.error);
    }
  },

  getUrlStatistics: async (shortcode) => {
    try {
      const response = await api.get(`/shorturls/${shortcode}`);
      return response.data;
    } catch (error) {
      const apiError = error.response?.data || { error: 'Network error' };
      throw new Error(apiError.error);
    }
  },

  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend service unavailable');
    }
  },
};

export default api;