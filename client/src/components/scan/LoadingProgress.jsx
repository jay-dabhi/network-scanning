import { FiLoader } from 'react-icons/fi';

export default function LoadingProgress({ progress, scanning }) {
  if (!scanning && !progress) return null;

  const stages = [
    'Discovering hosts...',
    'Scanning ports...',
    'Parsing results...',
    'Fetching HTTP data...',
    'Running AI analysis...'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <FiLoader className="text-blue-600 animate-spin text-2xl" />
        <h3 className="text-lg font-bold text-gray-800">Scan in Progress</h3>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              index === 0 ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'
            }`} />
            <span className={`text-sm ${
              index === 0 ? 'text-gray-800 font-medium' : 'text-gray-500'
            }`}>
              {stage}
            </span>
          </div>
        ))}
      </div>

      {progress && progress.toolResults && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Tools completed: {Object.keys(progress.toolResults).length}
          </p>
          <p className="text-sm text-gray-600">
            Elapsed: {Math.floor(progress.elapsedTime / 1000)}s
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        This may take several minutes depending on network size
      </div>
    </div>
  );
}
