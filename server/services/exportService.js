const fs = require('fs').promises;
const path = require('path');

class ExportService {
  async exportToJSON(scanResults, outputPath) {
    try {
      await fs.writeFile(
        outputPath,
        JSON.stringify(scanResults, null, 2),
        'utf-8'
      );
      return { success: true, path: outputPath };
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw error;
    }
  }

  async exportToCSV(scanResults, outputPath) {
    try {
      const csvLines = ['IP,Hostname,OS,Open Ports,Risk Level,Risk Score'];

      for (const host of scanResults.hosts) {
        const openPorts = host.ports
          .filter(p => p.state === 'open')
          .map(p => `${p.port}/${p.protocol}`)
          .join(';');

        const line = [
          host.ip,
          host.hostname || '',
          host.os ? host.os.name : '',
          openPorts,
          host.riskLevel || '',
          host.riskScore || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');

        csvLines.push(line);
      }

      await fs.writeFile(outputPath, csvLines.join('\n'), 'utf-8');
      return { success: true, path: outputPath };
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  async exportToHTML(scanResults, outputPath) {
    try {
      const html = this.generateHTMLReport(scanResults);
      await fs.writeFile(outputPath, html, 'utf-8');
      return { success: true, path: outputPath };
    } catch (error) {
      console.error('Error exporting to HTML:', error);
      throw error;
    }
  }

  generateHTMLReport(scanResults) {
    const timestamp = new Date(scanResults.metadata?.timestamp || Date.now()).toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pentest Report - ${timestamp}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .host { border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px; }
    .risk-high { background: #ffebee; border-left: 4px solid #f44336; }
    .risk-medium { background: #fff3e0; border-left: 4px solid #ff9800; }
    .risk-low { background: #e8f5e9; border-left: 4px solid #4caf50; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-high { background: #f44336; color: white; }
    .badge-medium { background: #ff9800; color: white; }
    .badge-low { background: #4caf50; color: white; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Penetration Testing Report</h1>
    <div class="summary">
      <h2>Summary</h2>
      <p><strong>Scan Date:</strong> ${timestamp}</p>
      <p><strong>Total Hosts:</strong> ${scanResults.summary?.totalHosts || 0}</p>
      <p><strong>Total Open Ports:</strong> ${scanResults.summary?.totalOpenPorts || 0}</p>
      <p><strong>High Risk Hosts:</strong> ${scanResults.summary?.riskDistribution?.high || 0}</p>
      <p><strong>Medium Risk Hosts:</strong> ${scanResults.summary?.riskDistribution?.medium || 0}</p>
      <p><strong>Low Risk Hosts:</strong> ${scanResults.summary?.riskDistribution?.low || 0}</p>
    </div>

    ${scanResults.hosts.map(host => `
      <div class="host risk-${host.riskLevel || 'low'}">
        <h3>${host.ip} ${host.hostname ? `(${host.hostname})` : ''} 
          <span class="badge badge-${host.riskLevel || 'low'}">${(host.riskLevel || 'low').toUpperCase()}</span>
        </h3>
        <p><strong>OS:</strong> ${host.os ? host.os.name : 'Unknown'}</p>
        <p><strong>Risk Score:</strong> ${host.riskScore || 'N/A'}/100</p>
        
        <h4>Open Ports (${host.ports.filter(p => p.state === 'open').length})</h4>
        <table>
          <tr>
            <th>Port</th>
            <th>Protocol</th>
            <th>Service</th>
            <th>Product</th>
            <th>Version</th>
          </tr>
          ${host.ports.filter(p => p.state === 'open').map(port => `
            <tr>
              <td>${port.port}</td>
              <td>${port.protocol}</td>
              <td>${port.service || 'unknown'}</td>
              <td>${port.product || '-'}</td>
              <td>${port.version || '-'}</td>
            </tr>
          `).join('')}
        </table>

        ${host.analysis ? `
          <h4>AI Analysis</h4>
          <p>${host.analysis.summary || ''}</p>
          ${host.analysis.recommendations ? `
            <h5>Recommendations:</h5>
            <ul>
              ${host.analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          ` : ''}
        ` : ''}
      </div>
    `).join('')}

    <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
      <p>Generated by Pentest Automation System</p>
    </footer>
  </div>
</body>
</html>`;
  }

  async export(scanResults, format, outputDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const scanId = scanResults.metadata?.scanId || 'unknown';
    
    let filename, result;

    switch (format.toLowerCase()) {
      case 'json':
        filename = `scan_${scanId}_${timestamp}.json`;
        result = await this.exportToJSON(scanResults, path.join(outputDir, filename));
        break;
      
      case 'csv':
        filename = `scan_${scanId}_${timestamp}.csv`;
        result = await this.exportToCSV(scanResults, path.join(outputDir, filename));
        break;
      
      case 'html':
        filename = `scan_${scanId}_${timestamp}.html`;
        result = await this.exportToHTML(scanResults, path.join(outputDir, filename));
        break;
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return result;
  }
}

module.exports = new ExportService();
