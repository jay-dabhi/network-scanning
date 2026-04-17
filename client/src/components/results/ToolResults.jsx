export default function ToolResults({ host }) {
  if (!host.toolData || Object.keys(host.toolData).length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      <h4 className="font-semibold text-gray-800">Tool-Specific Data</h4>
      
      {Object.entries(host.toolData).map(([toolName, toolData]) => (
        <div key={toolName} className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700 capitalize">
              {toolName}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(toolData.timestamp).toLocaleString()}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(toolData.rawData, null, 2)}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}
