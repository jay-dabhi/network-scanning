# Pentest Automation System

A **local-only** penetration testing automation system built with Node.js, Express, React, and Ollama for AI-powered security analysis.

## ⚠️ Important Disclaimer

**This tool is for authorized security testing ONLY.** Only scan networks you own or have explicit permission to test. Unauthorized network scanning may be illegal in your jurisdiction.

## Features

- 🔍 **Network Discovery**: Automated host discovery using Nmap
- 🔓 **Port Scanning**: Full port range scanning (1-65535)
- 🤖 **AI Analysis**: Security risk assessment using Ollama
- 🌐 **Web Service Detection**: HTTP/HTTPS service enumeration
- 📊 **Dashboard**: Clean, responsive UI with risk visualization
- 🔌 **Scalable Architecture**: Plugin-based system for adding new tools
- 💾 **Export**: Results export to JSON, CSV, and HTML

## Architecture

The system uses a **modular, plugin-based architecture** that makes it easy to add new security tools:

```
┌─────────────┐
│   Frontend  │ (React + Vite + Tailwind)
│  Dashboard  │
└──────┬──────┘
       │
┌──────▼──────┐
│  Express    │
│  API Server │
└──────┬──────┘
       │
┌──────▼──────────┐
│ Tool            │
│ Orchestrator    │
└──┬──────────┬───┘
   │          │
┌──▼───┐  ┌──▼────┐
│ Nmap │  │ Future│ (Hydra, Nikto, etc.)
│ Tool │  │ Tools │
└──┬───┘  └───────┘
   │
┌──▼──────────┐
│   Result    │
│ Aggregator  │
└──┬──────────┘
   │
┌──▼─────────┐
│  Ollama    │
│ AI Service │
└────────────┘
```

## Tech Stack

**Backend:**
- Node.js + Express.js
- Nmap (system dependency)
- xml2js for result parsing
- axios for HTTP requests

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Axios for API communication
- React Icons

**AI:**
- Ollama (local AI models)
- Supports: mistral, llama3, llama2, codellama

## Prerequisites

### System Requirements
- Node.js 16+ and npm
- Nmap installed and accessible
- Ollama installed with at least one model
- sudo/root access (for Nmap privileged scans)

### Install Dependencies

**1. Install Nmap**
```bash
# Linux (Debian/Ubuntu)
sudo apt install nmap

# macOS
brew install nmap
```

**2. Install Ollama**
```bash
# Visit https://ollama.ai for installation instructions

# Pull a model
ollama pull mistral
```

**3. Verify Installations**
```bash
nmap --version
ollama --version
```

## Installation

**1. Clone or download this repository**

**2. Install backend dependencies**
```bash
cd server
npm install
```

**3. Install frontend dependencies**
```bash
cd client
npm install
```

**4. Configure environment variables**
```bash
# In server/ directory
cp .env.example .env

# Edit .env with your settings
```

## Running the Application

**1. Start Ollama** (if not running as service)
```bash
ollama serve
```

**2. Start the backend** (requires sudo for Nmap)
```bash
cd server
sudo npm run dev

# Or for production
sudo npm start
```

**3. Start the frontend** (in a new terminal)
```bash
cd client
npm run dev
```

**4. Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Usage

1. **Configure Scan**
   - Enter network range (e.g., `192.168.1.0/24`)
   - Select tools to run (currently Nmap)
   - Choose Ollama model
   - Set rate limit

2. **Start Scan**
   - Click "Start Scan"
   - Monitor progress in real-time
   - Wait for completion (may take several minutes)

3. **View Results**
   - Host-by-host security analysis
   - Open ports and services
   - AI-generated risk assessment
   - Recommendations

4. **Export Results**
   - Export to JSON, CSV, or HTML
   - Results saved in `data/scans/[scanId]/`

## API Endpoints

### Scan Operations
- `POST /api/scan/start` - Start a new scan
- `GET /api/scan/status/:scanId` - Get scan status
- `GET /api/scan/results/:scanId` - Get scan results
- `GET /api/scan/history` - List all scans
- `DELETE /api/scan/:scanId` - Delete a scan
- `GET /api/scan/export/:scanId?format=json` - Export results

### Tool Management
- `GET /api/tools` - List all available tools
- `GET /api/tools/:toolName` - Get tool info
- `PUT /api/tools/:toolName/enable` - Enable/disable tool
- `POST /api/tools/:toolName/validate` - Check if tool is installed
- `GET /api/tools/config/global` - Get global configuration

## Adding New Security Tools

The system is designed to be easily extensible. Here's how to add a new tool (e.g., Hydra):

### 1. Create Tool Directory
```bash
mkdir server/tools/hydra
```

### 2. Implement Tool Class
Create `server/tools/hydra/HydraTool.js`:

```javascript
const ToolInterface = require('../../core/ToolInterface');
const { spawn } = require('child_process');

class HydraTool extends ToolInterface {
  constructor(config) {
    super(config);
    this.name = 'hydra';
    this.version = '';
  }

  async validate() {
    // Check if hydra is installed
    try {
      const version = await this.getVersion();
      this.version = version;
      return true;
    } catch (error) {
      return false;
    }
  }

  async execute(targets, options = {}) {
    // Run hydra commands
    // Use Nmap results from options.previousResults
    // Return results object
  }

  getParser() {
    return require('./HydraParser');
  }
}

module.exports = HydraTool;
```

### 3. Implement Parser
Create `server/tools/hydra/HydraParser.js`:

```javascript
class HydraParser {
  static async parse(scanResult, outputDir) {
    // Parse hydra output
    // Return unified format:
    return {
      tool: 'hydra',
      timestamp: new Date().toISOString(),
      hosts: [
        {
          ip: '192.168.1.10',
          credentials: [
            { service: 'ssh', username: 'admin', password: 'found' }
          ]
        }
      ]
    };
  }
}

module.exports = HydraParser;
```

### 4. Register Tool
Edit `server/tools/toolRegistry.js`:

```javascript
const HydraTool = require('./hydra/HydraTool');

function initializeTools() {
  registerTool('nmap', NmapTool);
  registerTool('hydra', HydraTool);  // Add this line
  
  return toolRegistry;
}
```

### 5. Add Configuration
Edit `server/config/toolsConfig.js`:

```javascript
hydra: {
  enabled: true,
  timeout: 7200000,
  priority: 2,
  dependencies: ['nmap']
}
```

That's it! The tool will now appear in the UI and can be selected for scans.

## Configuration

### Environment Variables

Edit `server/.env`:

```env
PORT=5000
HOST=localhost
CORS_ORIGIN=http://localhost:5173

OLLAMA_ENDPOINT=http://localhost:11434
DEFAULT_MODEL=mistral
OLLAMA_TIMEOUT=120000

DEFAULT_NETWORK=192.168.1.0/24
RATE_LIMIT_SECONDS=60
MAX_CONCURRENT_SCANS=1

FETCH_TIMEOUT=5000

AUTH_ENABLED=false
JWT_SECRET=change-me-in-production
```

### Tool Configuration

Edit `server/config/toolsConfig.js` to enable/disable tools and adjust settings.

## Project Structure

```
network-lookup/
├── server/                 # Backend
│   ├── core/              # Core system components
│   │   ├── ToolInterface.js
│   │   ├── ToolOrchestrator.js
│   │   └── ResultAggregator.js
│   ├── tools/             # Security tool plugins
│   │   ├── nmap/
│   │   │   ├── NmapTool.js
│   │   │   ├── NmapParser.js
│   │   │   └── nmapConfig.js
│   │   └── toolRegistry.js
│   ├── services/          # Business logic services
│   │   ├── fetchService.js
│   │   ├── ollamaService.js
│   │   └── exportService.js
│   ├── routes/            # API routes
│   │   ├── scanRoutes.js
│   │   └── toolRoutes.js
│   ├── middleware/        # Express middleware
│   │   ├── rateLimiter.js
│   │   ├── validator.js
│   │   └── auth.js
│   ├── config/            # Configuration
│   │   ├── config.js
│   │   └── toolsConfig.js
│   ├── utils/             # Helper functions
│   └── server.js          # Entry point
├── client/                # Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── scan/
│   │   │   ├── results/
│   │   │   └── common/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── data/                  # Scan results
│   ├── scans/
│   └── cache/
└── README.md
```

## Security Considerations

- **Private Networks Only**: The system validates that only private IP ranges (10.x, 172.16-31.x, 192.168.x) are scanned
- **Rate Limiting**: Configurable cooldown between scans to prevent abuse
- **Local AI**: Ollama runs entirely locally, no data sent to external servers
- **No Cloud Dependencies**: Everything runs on your machine
- **Authentication Ready**: JWT authentication middleware included (disabled by default)

## Troubleshooting

### Nmap Permission Issues
```bash
# Run server with sudo
sudo npm run dev

# Or configure sudo to not require password for nmap
sudo visudo
# Add: your_user ALL=(ALL) NOPASSWD: /usr/bin/nmap
```

### Ollama Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

### Port Already in Use
```bash
# Change ports in .env
PORT=5001  # Backend
# And in client/vite.config.js for frontend
```

## Future Enhancements

- [ ] Hydra integration for credential testing
- [ ] Nikto for web vulnerability scanning
- [ ] SQLMap for SQL injection testing
- [ ] Scheduled/recurring scans
- [ ] Webhook notifications
- [ ] Comparison between scans
- [ ] PDF report generation

## License

MIT

## Contributing

Contributions welcome! Please ensure any new security tools follow the plugin architecture described in this README.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review tool documentation (Nmap, Ollama)
3. Open an issue with detailed error messages

---

**Remember: Always obtain proper authorization before scanning any network.**
