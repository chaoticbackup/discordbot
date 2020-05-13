/* eslint-disable @typescript-eslint/no-floating-promises */
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import winston from 'winston';
import Discord from 'discord.js';

import responses from './responses';
import ForumAPI from './forum/api';
import ForumPosts from './forum/posts';
import ScanQuest from './scanquest';

import servers from './common/servers';
import { Channel } from './definitions';

const auth = require('./auth.json');

const development = process.env.NODE_ENV === 'development';
let devType = process.env.APP_ENV ?? '';

// Configure logger settings
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

// Initialize Discord Bot and server components
const bot = new Discord.Client();
const fp = new ForumPosts(bot);
const sq = new ScanQuest(bot, logger);

// Disabled freatures if api.json is missing or set to false
if (!development) {
  try {
    const api = require('./api.json');
    if (!!api) {
      devType = 'all';
      ForumAPI(logger);
    }
  }
  catch (e) { }
}

const start = () => {
  if (devType === 'all') {
    sq.start();
    fp.start();
  }
  else if (devType === 'scan') {
    sq.start();
  }
  else if (devType === 'forum') {
    fp.start()
  }
}

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
}

bot.on('ready', () => {
  start();
  if (!development) logger.info((new Date()).toLocaleTimeString('en-GB'));
  logger.info(`Logged in as: ${bot.user}`);
  bot.user.setActivity('!commands');
});

// Automatically reconnect if the bot disconnects
bot.on('disconnect', (CloseEvent) => {
  stop();
  logger.warn(`Reconnecting, ${CloseEvent.code}`);
  bot.login(auth.token).then(() => { sendError() });
});

let stackTrace = '';
const sendError = async () => {
  if (stackTrace) {
    const st = stackTrace;
    stackTrace = '';
    if (!development) {
      const channel = bot.channels.get(servers('develop').channel('errors'));
      if (channel) {
        return await (channel as Channel).send(st).catch(logger.error);
      }
    }
  }
}

// Responses
bot.on('message', msg => {
  checkSpam(msg);
  responses(bot, msg, logger);
  sq.monitor(msg);
});

// Ban Spam
const newMembers: Discord.Snowflake[] = [];
bot.on('guildMemberAdd', (member) => {
  if (member.displayName.match(new RegExp('(quasar$)|(discord\.me)|(discord\.gg)|(bit\.ly)|(twitch\.tv)|(twitter\.com)', 'i'))) {
    if (member.bannable) { member.ban().then(() => {
      // @ts-ignore
      bot.channels.get(servers('main').channel('staff')).send(`Banned: ${member.displayName}`);
      // Delete the meebot welcome message
      const meebot = bot.users.get('159985870458322944');
      if (meebot) { setTimeout(() => {
        if (meebot.lastMessage?.deletable) {
          meebot.lastMessage.delete();
        }
      }, 500); }
    }); }
  }
  else {
    newMembers.push(member.id);
  }
});

const checkSpam = async (msg: Discord.Message) => {
  if (!msg.guild) return;
  const index = newMembers.indexOf(msg.author.id);
  if (index < 0) return;

  // eslint-disable-next-line
  const regex = new RegExp(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/, 'gm');

  if (regex.test(msg.content)) {
    if (msg.member.bannable) {
      await msg.member.ban()
      .then(async () => {
        const channel = bot.channels.get(servers('main').channel('staff')) as Channel;
        return await channel.send(`Banned Spam: ${msg.member.displayName}\nContent: ${msg.content}`)
      })
      .then(() => { if (msg.deletable) msg.delete(); });
    }
  }

  newMembers.splice(index, 1);
}

process.on('unhandledRejection', (err) => {
  // @ts-ignore
  stackTrace = err?.stack ?? err;
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
}
process.on('SIGINT', handle);
process.on('SIGTERM', handle);

process.on('message', (msg) => {
  if (msg?.signal === 'SIGINT') handle(msg.signal);
});

process.on('exit', () => {
  clearInterval(timer);
});
