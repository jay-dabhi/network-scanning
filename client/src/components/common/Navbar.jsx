export default function Navbar() {
  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔒</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Pentest Automation System
              </h1>
              <p className="text-xs text-gray-500">Local Security Scanner</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Powered by Ollama + Nmap
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
