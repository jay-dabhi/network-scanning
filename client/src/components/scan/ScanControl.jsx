import { useState, useEffect } from 'react';
import { FiPlay, FiSettings } from 'react-icons/fi';
import { scanAPI } from '../../services/api';

export default function ScanControl({ onScanStart, scanning }) {
  const [networkRange, setNetworkRange] = useState('192.168.1.0/24');
  const [selectedTools, setSelectedTools] = useState(['nmap']);
  const [ollamaModel, setOllamaModel] = useState('mistral');
  const [rateLimitSeconds, setRateLimitSeconds] = useState(60);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRateLimitStatus();
  }, []);

  const loadRateLimitStatus = async () => {
    try {
      const response = await scanAPI.getRateLimitStatus();
      setRateLimitStatus(response);
    } catch (err) {
      console.error('Failed to load rate limit status:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!networkRange) {
      setError('Network range is required');
      return;
    }

    if (selectedTools.length === 0) {
      setError('At least one tool must be selected');
      return;
    }

    onScanStart({
      networkRange,
      tools: selectedTools,
      ollamaModel,
      rateLimitSeconds
    });
  };

  const canStartScan = rateLimitStatus?.canScan && !scanning;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiSettings className="text-blue-600" />
          Scan Configuration
        </h2>
        {rateLimitStatus && !rateLimitStatus.canScan && (
          <span className="text-sm text-orange-600 font-medium">
            Rate limit: {rateLimitStatus.remainingSeconds}s remaining
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network Range (CIDR)
          </label>
          <input
            type="text"
            value={networkRange}
            onChange={(e) => setNetworkRange(e.target.value)}
            placeholder="192.168.1.0/24"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={scanning}
          />
          <p className="mt-1 text-xs text-gray-500">
            Only private IP ranges allowed (10.x, 172.16-31.x, 192.168.x)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Tools
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedTools.includes('nmap')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTools([...selectedTools, 'nmap']);
                  } else {
                    setSelectedTools(selectedTools.filter(t => t !== 'nmap'));
                  }
                }}
                className="rounded text-blue-600"
                disabled={scanning}
              />
              <span className="text-sm">Nmap (Port Scanner)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ollama Model
          </label>
          <select
            value={ollamaModel}
            onChange={(e) => setOllamaModel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={scanning}
          >
            <option value="mistral">Mistral</option>
            <option value="llama3">Llama 3</option>
            <option value="llama2">Llama 2</option>
            <option value="codellama">CodeLlama</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rate Limit (seconds between scans)
          </label>
          <input
            type="number"
            value={rateLimitSeconds}
            onChange={(e) => setRateLimitSeconds(parseInt(e.target.value))}
            min="0"
            max="3600"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={scanning}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canStartScan}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
            canStartScan
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <FiPlay />
          {scanning ? 'Scanning...' : 'Start Scan'}
        </button>

        {!canStartScan && rateLimitStatus?.activeScan && (
          <p className="text-sm text-center text-gray-600">
            A scan is currently in progress
          </p>
        )}
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 font-medium">
          ⚠️ Warning: Only scan networks you own or have permission to test
        </p>
      </div>
    </div>
  );
}
