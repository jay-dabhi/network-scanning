# Quick Start Guide

## Installation Steps

### 1. Install System Dependencies

**Install Nmap:**
```bash
# Linux (Debian/Ubuntu)
sudo apt update
sudo apt install nmap

# macOS
brew install nmap

# Verify
nmap --version
```

**Install Ollama:**
```bash
# Visit https://ollama.ai and follow installation instructions

# After installation, pull a model
ollama pull mistral

# Verify
ollama list
```

### 2. Install Project Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 3. Configure Environment

```bash
# Copy example environment file
cd server
cp .env.example .env

# Edit .env if needed (defaults should work)
```

### 4. Run the Application

**Terminal 1 - Start Ollama (if not running as service):**
```bash
ollama serve
```

**Terminal 2 - Start Backend (requires sudo):**
```bash
cd server
sudo npm run dev
```

**Terminal 3 - Start Frontend:**
```bash
cd client
npm run dev
```

### 5. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## First Scan

1. Enter a network range (e.g., `192.168.1.0/24`)
2. Select "Nmap" tool
3. Choose an Ollama model (default: mistral)
4. Click "Start Scan"
5. Wait for results (may take several minutes)

## Common Issues

**Permission Denied (Nmap):**
```bash
# Make sure to run backend with sudo
sudo npm run dev
```

**Ollama Not Connected:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

**Port Already in Use:**
```bash
# Change PORT in server/.env
PORT=5001

# Or kill the process using the port
sudo lsof -ti:5000 | xargs kill -9
```

## Next Steps

- Read the full README.md for detailed documentation
- Check server/config/toolsConfig.js to enable/disable tools
- Review the architecture section to understand the system
- Follow the "Adding New Security Tools" guide to extend functionality

## Support

For detailed help, see the main README.md file.
