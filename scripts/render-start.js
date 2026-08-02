/**
 * Starts FastAPI when Render is still configured with `yarn start` (Node).
 * Installs deps if uvicorn is missing, then binds to $PORT.
 */
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const port = process.env.PORT || '8000';
const backendDir = path.join(__dirname, '..', 'backend');
const requirements = path.join(backendDir, 'requirements.txt');

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: backendDir,
    stdio: opts.silent ? 'pipe' : 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
}

function hasUvicorn(pythonCmd) {
  const check = run(pythonCmd, ['-c', 'import uvicorn'], { silent: true });
  return check.status === 0;
}

function ensureDeps() {
  const pythons = ['python3', 'python'];
  for (const py of pythons) {
    if (hasUvicorn(py)) {
      console.log(`[start] uvicorn already available via ${py}`);
      return py;
    }
  }

  console.log('[start] uvicorn missing — installing backend/requirements.txt ...');
  const installers = [
    ['pip3', ['install', '--user', '-r', requirements]],
    ['pip', ['install', '--user', '-r', requirements]],
    ['python3', ['-m', 'pip', 'install', '--user', '-r', requirements]],
    ['python', ['-m', 'pip', 'install', '--user', '-r', requirements]],
  ];

  let installed = false;
  for (const [cmd, args] of installers) {
    console.log(`[start] Trying: ${cmd} ${args.join(' ')}`);
    const result = run(cmd, args);
    if (result.status === 0) {
      installed = true;
      break;
    }
  }

  if (!installed) {
    console.error('[FATAL] Could not install uvicorn. Fix Render Settings:');
    console.error('  Runtime / Environment : Python 3');
    console.error('  Root Directory        : backend');
    console.error('  Build Command         : pip install -r requirements.txt');
    console.error('  Start Command         : uvicorn main:app --host 0.0.0.0 --port $PORT');
    process.exit(1);
  }

  for (const py of pythons) {
    if (hasUvicorn(py)) return py;
  }

  console.error('[FATAL] Deps installed but uvicorn still not importable.');
  process.exit(1);
}

const pythonCmd = ensureDeps();
const args = ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', String(port)];
console.log(`[start] ${pythonCmd} ${args.join(' ')} (cwd=${backendDir})`);

const child = spawn(pythonCmd, args, {
  cwd: backendDir,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code == null ? 1 : code));
child.on('error', (err) => {
  console.error('[FATAL] Failed to start API:', err.message);
  process.exit(1);
});
