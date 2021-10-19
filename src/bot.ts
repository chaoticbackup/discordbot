/* eslint-disable @typescript-eslint/no-floating-promises */
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import Discord from 'discord.js';

import logger from './logger';
import responses from './responses';
import startForumAPI from './forum/api';
import ForumPosts from './forum/posts';
import ScanQuest from './scanquest';

import servers from './common/servers';
import { Channel } from './definitions';
import { checkNewMember, checkSpam } from './antispam';

const auth = require('./auth.json') as {token: string};

const development = process.env.NODE_ENV === 'development';
export let devType = process.env.APP_ENV ?? '';

// Initialize Discord Bot and server components
const bot = new Discord.Client();
const fp = new ForumPosts(bot);
const sq = new ScanQuest(bot);

// Disabled freatures if api.json is missing or set to false
if (!development) {
  try {
    const api = require('./api.json');
    if (!!api) {
      devType = 'all';
      startForumAPI();
    }
  }
  catch (e) { }
}

const start = () => {
  if (devType === 'all') {
    // sq.start();
    fp.start();
  }
  else if (devType === 'scan') {
    sq.start();
  }
  else if (devType === 'forum') {
    fp.start();
  }
};

const stop = async () => {
  if (devType === 'all') {
    await sq.stop();
    fp.stop();
  }
  else if (devType === 'scan') {
    await sq.stop();
  }
  else if (devType === 'forum') {
    fp.stop();
  }
};

bot.on('ready', () => {
  start();
  let msg = `Logged in as: ${bot.user}`;
  if (!development) msg += ` at ${(new Date()).toLocaleDateString('en-GB')} ${(new Date()).toLocaleTimeString('en-GB')}`;
  logger.info(msg);
  bot.user.setActivity('!commands');
});

// Automatically reconnect if the bot disconnects
bot.on('disconnect', (CloseEvent) => {
  logger.warn(`Disconnected, ${CloseEvent.code}`);
  process.emit('SIGINT', 'SIGINT');
});

let stackTrace: any = null;
const sendError = async () => {
  if (stackTrace) {
    const st = stackTrace;
    stackTrace = null;
    if (!development) {
      const channel = bot.channels.get(servers('develop').channel('errors'));
      if (channel) {
        return await (channel as Channel).send(`${st}\n${st.stack}`).catch(error => { logger.error(error.stack); });
      }
    }
  }
};

// Responses
bot.on('message', msg => {
  if (!checkSpam(bot, msg)) {
    responses(bot, msg);
    sq.monitor(msg);
  }
});

// Ban Spam
bot.on('guildMemberAdd', checkNewMember);

process.on('unhandledRejection', (err) => {
  // @ts-ignore
  stackTrace = err;
  // Status.READY
  if (bot.status === 0) sendError();
  else bot.destroy();
});

/* LOGIN */
let timer: NodeJS.Timeout;
bot.login(auth.token).then(() => {
  // this will restart the bot if its down
  timer = setInterval(() => {
    if (bot.status > 1) {
      logger.warn('bot is down, restarting...');
      bot.destroy();
    }
  }, 120 * 1000);
});

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

const handle: NodeJS.SignalsListener = (_event) => {
  stop().then(() => {
    process.exit(0); // process exits after db closes
  });
};
process.on('SIGINT', handle);
process.on('SIGTERM', handle);

process.on('message', (msg) => {
  if (msg?.signal === 'SIGINT') handle(msg.signal);
});

process.on('exit', () => {
  clearInterval(timer);
});
