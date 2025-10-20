const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  return r.status === 0;
}

function getLastRun() {
  const p = path.join(process.cwd(), 'test-results', '.last-run.json');
  try { 
    return JSON.parse(fs.readFileSync(p, 'utf8')); 
  } catch { 
    return null; 
  }
}

console.log('▶ Initial full run so .last-run.json exists…\n');
run('npx', ['playwright', 'test', '--project=chromium']);

let iteration = 1;
while (true) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`▶ Re-running last failures (iteration ${iteration})…`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  run('npx', ['playwright', 'test', '--last-failed', '--project=chromium']);

  const last = getLastRun();
  const failed = last?.stats?.failed ?? 0;
  const passed = last?.stats?.expected ?? 0;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n✅✅✅ ALL TESTS PASSING! Exiting. ✅✅✅\n');
    process.exit(0);
  }
  
  console.log(`❌ ${failed} still failing — looping again in 2s… (Ctrl+C to stop)\n`);
  iteration++;
  
  // Sleep for 2 seconds before next iteration
  spawnSync('sleep', ['2']);
}

