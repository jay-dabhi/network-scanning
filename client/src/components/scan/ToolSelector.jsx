import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiSettings } from 'react-icons/fi';
import { toolsAPI } from '../../services/api';

export default function ToolSelector({ selectedTools, onToolsChange }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await toolsAPI.getAllTools();
      setTools(response.tools);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = (toolName) => {
    if (selectedTools.includes(toolName)) {
      onToolsChange(selectedTools.filter(t => t !== toolName));
    } else {
      onToolsChange([...selectedTools, toolName]);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading tools...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FiSettings />
        Available Tools
      </h3>

      <div className="space-y-3">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedTools.includes(tool.name)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => tool.installed && toggleTool(tool.name)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedTools.includes(tool.name)}
                  onChange={() => toggleTool(tool.name)}
                  disabled={!tool.installed}
                  className="rounded text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-800 capitalize">
                    {tool.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {tool.version || 'Unknown version'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {tool.installed ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <FiCheck /> Installed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 text-sm">
                    <FiX /> Not installed
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
