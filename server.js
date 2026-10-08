const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_ENV = (process.env.APP_ENV || 'production').toLowerCase();
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const COMMIT_SHA = process.env.COMMIT_SHA || 'local-build';
const DEPLOY_TIME = process.env.DEPLOY_TIME || new Date().toISOString();

// Health check endpoint for container and CI/CD verification
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: APP_ENV,
    version: APP_VERSION,
    commit: COMMIT_SHA,
    uptime: Math.floor(process.uptime()),
    hostname: os.hostname(),
    timestamp: new Date().toISOString()
  });
});

// JSON info API
app.get('/api/info', (req, res) => {
  res.json({
    appName: 'IS373 Simple Web Application',
    environment: APP_ENV,
    version: APP_VERSION,
    commit: COMMIT_SHA,
    deployedAt: DEPLOY_TIME,
    nodeVersion: process.version
  });
});

// Main HTML page
app.get('/', (req, res) => {
  const isQA = APP_ENV === 'qa';
  const envTitle = isQA ? 'QA Staging Environment' : 'Production Environment';
  const envBadgeClass = isQA ? 'badge-qa' : 'badge-prod';
  const envColor = isQA ? '#f59e0b' : '#10b981';
  const shortSha = COMMIT_SHA.length > 7 ? COMMIT_SHA.substring(0, 7) : COMMIT_SHA;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${envTitle} | IS 373 CI/CD</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 30, 49, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --accent: ${envColor};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background-image: 
        radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 80%, ${isQA ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)'} 0%, transparent 40%);
    }
    .container {
      width: 100%;
      max-width: 820px;
      backdrop-filter: blur(16px);
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 24px;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .title-area h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .title-area p {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 4px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-qa {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .badge-prod {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 8px currentColor;
    }
    .banner {
      background: ${isQA ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'};
      border-left: 4px solid var(--accent);
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 28px;
      font-size: 15px;
      line-height: 1.5;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px;
    }
    .card-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .card-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 600;
      color: #e2e8f0;
      word-break: break-all;
    }
    .test-section {
      background: rgba(15, 23, 42, 0.4);
      border: 1px dashed var(--card-border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .test-section h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .test-section p {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 14px;
    }
    .btn {
      background: var(--accent);
      color: #000;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn:hover {
      filter: brightness(1.15);
      transform: translateY(-1px);
    }
    .health-result {
      margin-top: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      background: #0f172a;
      padding: 12px;
      border-radius: 8px;
      display: none;
      border: 1px solid var(--card-border);
    }
    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-muted);
      font-size: 13px;
      border-top: 1px solid var(--card-border);
      padding-top: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    footer a {
      color: #38bdf8;
      text-decoration: none;
    }
    footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-area">
        <h1>IS 373 Automated Delivery</h1>
        <p>Containerized deployment via GitHub Actions & Docker</p>
      </div>
      <div class="badge ${envBadgeClass}">
        <span class="pulse-dot"></span>
        ${APP_ENV.toUpperCase()} ENVIRONMENT
      </div>
    </div>

    <div class="banner">
      <strong>Pipeline Status:</strong> Serving live from <strong>${envTitle}</strong>. 
      ${isQA 
        ? 'Changes pushed to branch <code>qa</code> automatically deploy here for testing.' 
        : 'Approved changes merged into branch <code>main</code> are promoted directly here.'}
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-label">Application Version</div>
        <div class="card-value">v${APP_VERSION}</div>
      </div>
      <div class="card">
        <div class="card-label">Active Environment</div>
        <div class="card-value" style="color: var(--accent);">${APP_ENV}</div>
      </div>
      <div class="card">
        <div class="card-label">Git Commit</div>
        <div class="card-value">${shortSha}</div>
      </div>
      <div class="card">
        <div class="card-label">Host Node</div>
        <div class="card-value">${os.hostname()}</div>
      </div>
    </div>

    <div class="test-section">
      <h3>Live Verification</h3>
      <p>Test the container's internal health check endpoint directly from your browser.</p>
      <button class="btn" onclick="checkHealth()">Test /health endpoint</button>
      <pre id="healthDisplay" class="health-result"></pre>
    </div>

    <footer>
      <span>DigitalOcean Droplet: <code>167.172.142.170</code></span>
      <span>Managed with Traefik & Docker</span>
    </footer>
  </div>

  <script>
    async function checkHealth() {
      const box = document.getElementById('healthDisplay');
      box.style.display = 'block';
      box.textContent = 'Querying /health...';
      try {
        const res = await fetch('/health');
        const data = await res.json();
        box.textContent = JSON.stringify(data, null, 2);
        box.style.borderColor = '#10b981';
      } catch (err) {
        box.textContent = 'Error querying health: ' + err.message;
        box.style.borderColor = '#ef4444';
      }
    }
  </script>
</body>
</html>`;

  res.send(html);
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IS373 App running on http://0.0.0.0:${PORT} [${APP_ENV.toUpperCase()}]`);
  });
}

module.exports = app;
