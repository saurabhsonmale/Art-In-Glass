/**
 * Safety net if Render is still configured with `yarn start`.
 * Prefer switching the service to Python (see render.yaml).
 * This script starts the FastAPI backend with uvicorn when Python is available.
 */
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || '8000';
const backendDir = path.join(__dirname, '..', 'backend');

const candidates = [
  ['python', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', String(port)]],
  ['python3', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', String(port)]],
  ['uvicorn', ['main:app', '--host', '0.0.0.0', '--port', String(port)]],
];

function tryNext(i) {
  if (i >= candidates.length) {
    console.error('');
    console.error('[FATAL] Render is running yarn/node, but Art In Glass API is Python/FastAPI.');
    console.error('Fix in Render Dashboard → Settings:');
    console.error('  Runtime / Environment : Python 3');
    console.error('  Root Directory        : backend');
    console.error('  Build Command         : pip install -r requirements.txt');
    console.error('  Start Command         : uvicorn main:app --host 0.0.0.0 --port $PORT');
    console.error('');
    process.exit(1);
  }

  const [cmd, args] = candidates[i];
  console.log(`[start] Trying: ${cmd} ${args.join(' ')} (cwd=${backendDir})`);
  const child = spawn(cmd, args, {
    cwd: backendDir,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });

  child.on('error', () => tryNext(i + 1));
  child.on('exit', (code) => {
    if (code === 0) process.exit(0);
    // Command missing / failed to bind → try next candidate
    if (code === 127 || code === 1) {
      tryNext(i + 1);
      return;
    }
    process.exit(code || 1);
  });
}

tryNext(0);
