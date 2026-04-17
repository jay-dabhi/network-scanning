import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import Navbar from './components/common/Navbar';
import ErrorBoundary from './components/common/ErrorBoundary';
import ScanControl from './components/scan/ScanControl';
import LoadingProgress from './components/scan/LoadingProgress';
import HostCard from './components/results/HostCard';
import { useScan } from './hooks/useScan';
import { scanAPI } from './services/api';

function App() {
  const { scanning, scanId, results, error, progress, startScan, clearResults } = useScan();
  const [exportFormat, setExportFormat] = useState('json');

  const handleExport = async () => {
    if (!scanId) return;

    try {
      const response = await scanAPI.exportScan(scanId, exportFormat);
      alert(`Export successful: ${response.path}`);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        <Navbar />

        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <ScanControl onScanStart={startScan} scanning={scanning} />
              <LoadingProgress progress={progress} scanning={scanning} />
            </div>

            <div className="lg:col-span-2">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
                  <h3 className="font-bold mb-2">Error</h3>
                  <p>{error}</p>
                </div>
              )}

              {results && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-800">
                        Scan Results
                      </h2>
                      <div className="flex items-center gap-3">
                        <select
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="json">JSON</option>
                          <option value="csv">CSV</option>
                          <option value="html">HTML</option>
                        </select>
                        <button
                          onClick={handleExport}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          <FiDownload />
                          Export
                        </button>
                        <button
                          onClick={clearResults}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">
                          {results.summary?.totalHosts || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Total Hosts</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          {results.summary?.totalOpenPorts || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Open Ports</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-3xl font-bold text-red-600">
                          {results.summary?.riskDistribution?.high || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">High Risk</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-3xl font-bold text-yellow-600">
                          {results.summary?.riskDistribution?.medium || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Medium Risk</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {results.hosts && results.hosts.length > 0 ? (
                      results.hosts.map((host, index) => (
                        <HostCard key={host.ip || index} host={host} />
                      ))
                    ) : (
                      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                        No hosts discovered
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!results && !scanning && !error && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Ready to Scan
                  </h3>
                  <p className="text-gray-600">
                    Configure your scan settings and click "Start Scan" to begin
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
