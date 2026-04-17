# Running Instructions

## Prerequisites Check

Before starting, verify you have:
- ✅ Node.js 16+ installed (`node --version`)
- ✅ npm installed (`npm --version`)
- ✅ Nmap installed (`nmap --version`)
- ✅ Ollama installed with a model (`ollama list`)
- ✅ sudo/root access available

## Step-by-Step Execution

### 1. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies  
cd ../client
npm install
```

### 2. Start Ollama

```bash
# If not running as a service, start Ollama in a terminal
ollama serve
```

Keep this terminal open.

### 3. Start Backend Server

**Important: Must run with sudo for Nmap to work properly**

```bash
# In a new terminal
cd server

# Development mode
sudo npm run dev

# Production mode
sudo npm start
```

You should see:
```
🚀 Pentest Automation Server is running!
📡 API: http://localhost:5000
🔍 Health check: http://localhost:5000/health

⚠️  Remember to run with sudo for full Nmap functionality
```

### 4. Start Frontend

```bash
# In a new terminal
cd client
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 5. Access Application

Open your browser:
- **Main UI:** http://localhost:5173
- **API Health:** http://localhost:5000/health

## Testing the Setup

1. **Test Backend:**
```bash
curl http://localhost:5000/health
# Should return: {"status":"healthy", ...}

curl http://localhost:5000/api/tools
# Should return list of available tools
```

2. **Test Ollama:**
```bash
curl http://localhost:11434/api/tags
# Should return list of installed models
```

3. **Run First Scan:**
- Open http://localhost:5173
- Enter network range: `192.168.1.0/24`
- Click "Start Scan"
- Wait for results

## Running in Production

For production deployment:

```bash
# Backend (use a process manager like PM2)
sudo npm install -g pm2
cd server
sudo pm2 start server.js --name pentest-backend

# Frontend (build static files)
cd client
npm run build
# Serve the dist/ folder with nginx or similar
```

## Stopping the Application

```bash
# Stop backend (Ctrl+C or)
sudo pkill -f "node server.js"

# Stop frontend (Ctrl+C in terminal)

# Stop Ollama (if you started it manually)
pkill ollama
```

## Environment Variables

Default configuration works out of the box. To customize:

```bash
# Edit server/.env
cd server
nano .env

# Common changes:
PORT=5000                          # Backend port
OLLAMA_ENDPOINT=http://localhost:11434
DEFAULT_MODEL=mistral              # Change AI model
DEFAULT_NETWORK=192.168.1.0/24    # Default scan range
RATE_LIMIT_SECONDS=60             # Cooldown between scans
```

## Troubleshooting

**Backend won't start:**
- Check if port 5000 is available: `lsof -i :5000`
- Verify Node.js is installed: `node --version`
- Check logs for error messages

**Frontend won't start:**
- Check if port 5173 is available: `lsof -i :5173`
- Try deleting node_modules and reinstalling: `rm -rf node_modules && npm install`

**Nmap errors:**
- Make sure you're running backend with `sudo`
- Verify Nmap is installed: `which nmap`
- Test Nmap manually: `sudo nmap -sn 192.168.1.0/24`

**Ollama errors:**
- Check Ollama is running: `curl http://localhost:11434/api/tags`
- Verify model is installed: `ollama list`
- Pull a model if missing: `ollama pull mistral`

**Scan takes too long:**
- Reduce network range (scan fewer IPs)
- Adjust Nmap timing in `server/tools/nmap/NmapTool.js`
- Check network connectivity

## Development vs Production

**Development** (current setup):
- Hot reload enabled
- Detailed error messages
- CORS enabled for localhost
- Not optimized for performance

**Production** (recommended):
- Build frontend: `npm run build`
- Set `NODE_ENV=production`
- Use process manager (PM2)
- Enable authentication in config
- Use reverse proxy (nginx)
- Set proper CORS origins
- Use HTTPS

## Logs and Debugging

**Backend logs:**
```bash
# Logs are output to console
# For production, redirect to file:
sudo npm start > logs/server.log 2>&1
```

**Check scan results:**
```bash
# All scan results are stored in:
ls data/scans/

# View specific scan:
cat data/scans/[scanId]/final_results.json
```

**Monitor in real-time:**
```bash
# Watch backend logs
tail -f logs/server.log

# Watch scan directory
watch -n 1 'ls -lh data/scans/'
```

## Need Help?

1. Check QUICKSTART.md for common issues
2. Review README.md for full documentation
3. Verify all prerequisites are installed
4. Check terminal output for error messages
5. Test each component individually (Nmap, Ollama, API)
