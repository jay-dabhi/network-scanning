import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const scanAPI = {
  startScan: async (config) => {
    const response = await api.post('/scan/start', config);
    return response.data;
  },

  getScanStatus: async (scanId) => {
    const response = await api.get(`/scan/status/${scanId}`);
    return response.data;
  },

  getScanResults: async (scanId) => {
    const response = await api.get(`/scan/results/${scanId}`);
    return response.data;
  },

  getScanHistory: async () => {
    const response = await api.get('/scan/history');
    return response.data;
  },

  deleteScan: async (scanId) => {
    const response = await api.delete(`/scan/${scanId}`);
    return response.data;
  },

  exportScan: async (scanId, format = 'json') => {
    const response = await api.get(`/scan/export/${scanId}`, {
      params: { format }
    });
    return response.data;
  },

  getRateLimitStatus: async () => {
    const response = await api.get('/scan/rate-limit/status');
    return response.data;
  }
};

export const toolsAPI = {
  getAllTools: async () => {
    const response = await api.get('/tools');
    return response.data;
  },

  getTool: async (toolName) => {
    const response = await api.get(`/tools/${toolName}`);
    return response.data;
  },

  getToolConfig: async (toolName) => {
    const response = await api.get(`/tools/${toolName}/config`);
    return response.data;
  },

  updateToolConfig: async (toolName, config) => {
    const response = await api.put(`/tools/${toolName}/config`, config);
    return response.data;
  },

  validateTool: async (toolName) => {
    const response = await api.post(`/tools/${toolName}/validate`);
    return response.data;
  },

  setToolEnabled: async (toolName, enabled) => {
    const response = await api.put(`/tools/${toolName}/enable`, { enabled });
    return response.data;
  },

  getGlobalConfig: async () => {
    const response = await api.get('/tools/config/global');
    return response.data;
  },

  updateGlobalConfig: async (config) => {
    const response = await api.put('/tools/config/global', config);
    return response.data;
  }
};

export default api;
