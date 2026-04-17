import { useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';

export default function PortDetails({ ports, webData = [] }) {
  const [selectedPort, setSelectedPort] = useState(null);

  const getWebDataForPort = (port) => {
    return webData.find(w => w.port === port);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                Port
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                Protocol
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                State
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                Service
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                Product
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                Version
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                Web
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ports.map((port, index) => {
              const webInfo = getWebDataForPort(port.port);
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {port.port}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {port.protocol}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      port.state === 'open' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {port.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {port.service || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {port.product || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {port.version || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {webInfo && (
                      <button
                        onClick={() => setSelectedPort(selectedPort === port.port ? null : port.port)}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        <FiExternalLink size={14} />
                        View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedPort && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          {(() => {
            const webInfo = getWebDataForPort(selectedPort);
            if (!webInfo) return null;

            return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">
                    Web Response - Port {selectedPort}
                  </h4>
                  <button
                    onClick={() => setSelectedPort(null)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">URL:</span>{' '}
                    <a 
                      href={webInfo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {webInfo.url}
                    </a>
                  </div>

                  {webInfo.status && (
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>{' '}
                      <span className={`font-mono ${
                        webInfo.status >= 200 && webInfo.status < 300 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {webInfo.status} {webInfo.statusText}
                      </span>
                    </div>
                  )}

                  {webInfo.title && (
                    <div>
                      <span className="font-medium text-gray-700">Title:</span>{' '}
                      {webInfo.title}
                    </div>
                  )}

                  {webInfo.headers?.server && (
                    <div>
                      <span className="font-medium text-gray-700">Server:</span>{' '}
                      {webInfo.headers.server}
                    </div>
                  )}

                  {webInfo.preview && (
                    <div>
                      <span className="font-medium text-gray-700 block mb-1">
                        Preview:
                      </span>
                      <pre className="bg-white p-3 rounded border border-gray-300 overflow-x-auto text-xs">
                        {webInfo.preview}
                      </pre>
                    </div>
                  )}

                  {webInfo.error && (
                    <div className="text-red-600">
                      <span className="font-medium">Error:</span> {webInfo.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
