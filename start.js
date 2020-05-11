const winston = require('winston');
const chokidar = require('chokidar');
const path = require('path');
const { spawn/*, exec*/ } = require("child_process");
const os = require('os');

function debounced(delay, fn) {
  let timerId;
  return function (...args) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  }
}

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    transports: [
      new winston.transports.Console()
    ]
});

/* globals */
const clean = process.argv.includes("--clean");
const outdir = "build";
let exiting = false;
let init = false;
let timeout;
let run_watcher;

const kill = (ps) => {
  if (!exiting) {
    ps.send({ signal: 'SIGINT' });
  }
  // else if (os.platform() === 'win32') {
  //   exec('taskkill /T /F /pid ' + ps.pid);
  // }
  else {
    ps.kill("SIGINT");
  }
}

const handle_error = (proc, msg) => { logger.error(proc, msg); }
const handle_exit = (proc, code) => { 
  logger.error(proc + ' exited with: ' + code); 
  exit();
}

/* Start bot */
const bot_path = path.resolve(__dirname, "build", "bot.js");
const bot_options = (os.platform() === "win32") ? {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc'], 
  env: { NODE_CHANNEL_FD: 3 },
  shell: false
} : {
  stdio: ['inherit', 'pipe', 'inherit', 'ipc'],
  shell: true
}

const start = () => {
  run_watcher = spawn("node", [bot_path], bot_options);
  // run_watcher.unref();
  run_watcher.stdout.on('data', data => {
    console.log(data.toString());
    if (!init && data.toString().includes('Logged in as:')) { init = true; }
  });
  run_watcher.on('error', (err) => handle_error('bot', err));
  run_watcher.on('exit', (code) => {
    if (exiting) { process.exit(); }
    else if (code === 0) { logger.info("Files changed, restarting bot"); start(); } 
    else {run_watcher.killed = true; handle_exit('bot', code); }
  });
}

/* Start babel watch */
const babel_path = ((os.platform() === "win32") ? 'node ' : '') +
  path.resolve(__dirname, "node_modules/@babel/cli/bin/babel.js");

const babel_args = [
  "--watch", "src"
].concat(
  clean ? ["--delete-dir-on-start"] : [],
  [
    "--extensions", "\".js,.ts\"", 
    "--copy-files", 
    "--out-dir", outdir
  ]
);

const babel_options = { stdio: ['inherit', 'pipe', 'inherit'], cwd: __dirname, shell: true };

const babel_watcher = spawn(babel_path, babel_args, babel_options);
babel_watcher.stdout.on('data', (data) => {
  logger.info(data);
  // Start bot after files are compiled
  if (!init && data.toString().indexOf('Successfully compiled') === 0) {
    logger.info("Starting development bot");
    start();
  }
});
babel_watcher.on('error', (error) => { handle_error('babel', error) });
babel_watcher.on('exit', (code) => {
  if (!exiting) {
    babel_watcher.killed = true;
    handle_exit('babel', code);
  }
});


/* Watch build folder */
const restarter = debounced(500, () => { init=false; kill(run_watcher) });
const build_watcher = chokidar.watch(outdir, { persistant: true });
build_watcher.on('change', (/*path*/) => { if (init) { restarter(); } });

/* Windows pick up sigint */
if (process.platform === 'win32') {
  var rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    process.kill(process.pid, 'SIGINT');
  });
}


/* Handle SIGINT */
const exit = async () => {
  exiting = true;
  clearTimeout(timeout);
  if (!babel_watcher.killed) kill(babel_watcher);
  await build_watcher.close();
  if (run_watcher && !run_watcher.killed) {
    kill(run_watcher);
  } else {
    process.exit();
  }
}

process.once('SIGINT', exit);
process.once('SIGTERM', exit);

// run_watcher.send({ signal: 'SIGINT' });
// run_watcher.on('message', () => {
//   process.exit();
// })

    // process.on('message', (msg) => {
//   if (msg.signal && msg.signal === 'SIGINT') {
//     stop().then(() => {
//       (process as any).send({ signal: msg.signal });
//       process.exit(1);
//     });
//   }
// });
