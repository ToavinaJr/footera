import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args) {
  const result = spawnSync(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Preview deployments must never migrate a shared production database.
if (process.env.VERCEL_ENV === 'production') {
  run(['run', 'db:deploy']);
}

run(['run', 'build']);
