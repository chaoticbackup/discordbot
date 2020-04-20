const winston = require('winston');
const chokidar = require('chokidar');
const path = require('path');
const { spawn } = require("child_process");

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

const handle_error = (proc, msg) => { logger.error(proc, msg); handle(); }
const handle_exit = (proc, code) => { logger.error(proc + ' exited with: ' + code); handle(); }

/* globals */
let init = false;
let timeout;
let run_watcher;

/* Start bot */
const bot_path = "node " + path.resolve(__dirname, "build/bot.js");
const bot_options = { stdio: 'inherit', shell: true };

const start = () => {
  run_watcher = spawn(bot_path, bot_options);
  run_watcher.on('error', (err) => handle_error('bot', err));
  run_watcher.on('exit', (code) => {
    if (code === 0) { logger.info("Files changed, restarting bot"); start(); } 
    else handle_exit('bot', code);
  });
}

/* Start babel watch */
const babel_path = path.resolve(__dirname, "node_modules/@babel/cli/bin/babel.js");
const babel_args = [
    "--watch", "src", 
    "--delete-dir-on-start",
    "--extensions", "\".js,.ts\"", 
    "--copy-files", 
    "--out-dir", "build"
];
const babel_options = { stdio: ['inherit', 'pipe', 'inherit'], cwd: __dirname, shell: true };

const babel_watcher = spawn(babel_path, babel_args, babel_options);
babel_watcher.on('error', (error) => handle_error('babel', error));
babel_watcher.on('exit', (code) => handle_exit('babel', code));
babel_watcher.stdout.on('data', (data) => {
  logger.info(data);
  // Start bot after files are compiled
  if (!init && data.toString().indexOf('Successfully compiled') === 0) {
    timeout = setTimeout(() => {init = true;}, 500);
    logger.info("Starting development bot");
    start();
  }
});

/* Watch build folder */
const restarter = debounced(400, () => { run_watcher.kill('SIGINT'); });
const build_watcher = chokidar.watch('build', { persistant: true });
build_watcher.on('change', (/* path */) => { if (init) restarter(); });

/* Windows pick up sigint */
if (process.platform === 'win32') {
  var rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    // @ts-ignore
    process.emit('SIGINT');
  });
}

/* Handle SIGINT */
const handle = async () => {
  clearTimeout(timeout);
  if (run_watcher) run_watcher.kill();
  babel_watcher.kill();
  await build_watcher.close();
  process.exit();
};

process.on('SIGINT', handle);
process.on('SIGTERM', handle);
