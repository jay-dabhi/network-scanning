import { useState, useCallback } from 'react';
import { scanAPI } from '../services/api';

export function useScan() {
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  const startScan = useCallback(async (config) => {
    setScanning(true);
    setError(null);
    setScanId(null);
    setResults(null);
    setProgress(null);

    try {
      const response = await scanAPI.startScan(config);
      
      if (response.success) {
        setScanId(response.scanId);
        pollScanStatus(response.scanId);
      } else {
        throw new Error(response.message || 'Failed to start scan');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setScanning(false);
    }
  }, []);

  const pollScanStatus = useCallback(async (id) => {
    const maxAttempts = 120;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Scan timeout');
        setScanning(false);
        return;
      }

      try {
        const statusResponse = await scanAPI.getScanStatus(id);
        
        if (statusResponse.status === 'completed') {
          const resultsResponse = await scanAPI.getScanResults(id);
          setResults(resultsResponse.results);
          setScanning(false);
          setProgress(null);
        } else if (statusResponse.status === 'running') {
          setProgress(statusResponse);
          attempts++;
          setTimeout(poll, 3000);
        } else if (statusResponse.status === 'failed') {
          setError('Scan failed');
          setScanning(false);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setTimeout(poll, 3000);
        } else {
          setError(err.response?.data?.message || err.message);
          setScanning(false);
        }
      }
    };

    poll();
  }, []);

  const loadScan = useCallback(async (id) => {
    try {
      const response = await scanAPI.getScanResults(id);
      setResults(response.results);
      setScanId(id);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setScanId(null);
    setError(null);
    setProgress(null);
  }, []);

  return {
    scanning,
    scanId,
    results,
    error,
    progress,
    startScan,
    loadScan,
    clearResults
  };
}
