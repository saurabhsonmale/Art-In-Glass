/**
 * Install Python API deps when Render is still on a Node/yarn service.
 * Preferred long-term: switch Runtime to Python 3 (see render.yaml).
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.join(__dirname, '..', 'backend');
const requirements = path.join(backendDir, 'requirements.txt');

if (!fs.existsSync(requirements)) {
  console.error('[install] Missing backend/requirements.txt');
  process.exit(1);
}

const pipCmds = [
  ['pip3', ['install', '--user', '-r', requirements]],
  ['pip', ['install', '--user', '-r', requirements]],
  ['python3', ['-m', 'pip', 'install', '--user', '-r', requirements]],
  ['python', ['-m', 'pip', 'install', '--user', '-r', requirements]],
];

let ok = false;
for (const [cmd, args] of pipCmds) {
  console.log(`[install] Trying: ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, {
    cwd: backendDir,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  if (result.status === 0) {
    ok = true;
    console.log('[install] Python dependencies installed');
    break;
  }
}

if (!ok) {
  console.error('[install] Could not install Python deps with pip.');
  console.error('Switch Render Runtime to Python 3 and set:');
  console.error('  Root Directory : backend');
  console.error('  Build Command  : pip install -r requirements.txt');
  console.error('  Start Command  : uvicorn main:app --host 0.0.0.0 --port $PORT');
  process.exit(1);
}
