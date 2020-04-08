// https://stackoverflow.com/questions/50272899/how-to-notify-a-child-process-from-forever-monitor-on-sigint-in-parent-process
const path = require('path');
const { spawn } = require('child_process');

let child;

const exit = (signal) => {
  console.error(`Received "${signal}" signal on main process.`);
  if (child) {
    child.send({ action: 'close' });
    process.exit(1);
  }
}

['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => exit(signal)));

process.on('exit', (code) => {
  if (child && code === 0) {
    child.send({ action: 'close' });
  }
});

child = spawn(process.argv[0], [path.join(__dirname, 'build', 'bot.js')], { detached: true, stdio: 'inherit' });

if (process.platform === 'win32') {
  var rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    process.emit('SIGINT');
  });
}
