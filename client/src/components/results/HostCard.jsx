import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiServer, FiGlobe } from 'react-icons/fi';
import RiskBadge from './RiskBadge';
import PortDetails from './PortDetails';

export default function HostCard({ host }) {
  const [expanded, setExpanded] = useState(false);
  const [showPorts, setShowPorts] = useState(false);

  const openPorts = host.ports?.filter(p => p.state === 'open') || [];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FiServer className="text-blue-600 text-xl" />
              <h3 className="text-lg font-bold text-gray-800">{host.ip}</h3>
              <RiskBadge level={host.riskLevel} score={host.riskScore} />
            </div>

            {host.hostname && (
              <p className="text-sm text-gray-600 ml-8">
                <FiGlobe className="inline mr-1" />
                {host.hostname}
              </p>
            )}

            {host.os && (
              <p className="text-sm text-gray-600 ml-8 mt-1">
                OS: {typeof host.os === 'object' ? host.os.name : host.os}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 ml-8 text-sm">
              <span className="text-gray-600">
                <strong>{openPorts.length}</strong> open ports
              </span>
              {host.webData && host.webData.length > 0 && (
                <span className="text-gray-600">
                  <strong>{host.webData.length}</strong> web services
                </span>
              )}
            </div>
          </div>

          <button className="text-gray-400 hover:text-gray-600">
            {expanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
          </button>
        </div>

        {host.analysis?.summary && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg ml-8">
            <p className="text-sm text-gray-700">{host.analysis.summary}</p>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6 space-y-4">
            <div>
              <button
                onClick={() => setShowPorts(!showPorts)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {showPorts ? <FiChevronUp /> : <FiChevronDown />}
                Port Details ({openPorts.length} open)
              </button>

              {showPorts && openPorts.length > 0 && (
                <div className="mt-3">
                  <PortDetails ports={openPorts} webData={host.webData} />
                </div>
              )}
            </div>

            {host.analysis?.recommendations && host.analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1">
                  {host.analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {host.analysis?.findings && host.analysis.findings.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Findings</h4>
                <div className="space-y-2">
                  {host.analysis.findings.map((finding, index) => (
                    <div key={index} className="p-3 bg-white rounded border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase ${
                          finding.severity === 'high' ? 'text-red-600' :
                          finding.severity === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {finding.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {finding.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{finding.description}</p>
                      {finding.recommendation && (
                        <p className="text-xs text-gray-500 mt-1">
                          💡 {finding.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
