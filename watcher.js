const { execSync } = require('child_process');

process.on('SIGINT', () => {
  try {
    execSync('git add public/data/entries.json');
    execSync(`git commit -m "entries: ${new Date().toLocaleDateString('en-CA')}"`);
    execSync('git push');
    console.log('pushed on exit');
  } catch (e) {
    console.log('nothing to push');
  }
  process.exit();
});