/* eslint-disable @typescript-eslint/no-floating-promises */
import winston from 'winston';
import Discord from 'discord.js';

import responses from './responses';
import ForumAPI from './forum/api';
import ForumPosts from './forum/posts';
import ScanQuest from './scanquest';

import servers from './common/servers';
import { Channel } from './definitions';
require('@babel/polyfill/noConflict');

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

const stop = () => {
  if (devType === 'all') {
    sq.stop();
    fp.stop();
  }
  else if (devType === 'scan') {
    sq.stop();
  }
  else if (devType === 'forum') {
    fp.stop()
  }
}

bot.on('ready', () => {
  start();
  bot.user.setActivity('!commands');
});

// Automatically reconnect if the bot disconnects
bot.on('disconnect', (CloseEvent) => {
  stop();
  logger.warn(`Reconnecting, ${CloseEvent.code}`);
  bot.login(auth.token).then(() => { sendError() });
});

let stackTrace = '';
const sendError = () => {
  if (stackTrace) {
    logger.error(stackTrace);
    if (!development) {
      const channel = bot.channels.get(servers('develop').channel('errors'));
      if (channel) {
        (channel as Channel).send(stackTrace).catch(logger.error);
      }
    }
    stackTrace = '';
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
  if (!msg.guild) return Promise.resolve();
  const index = newMembers.indexOf(msg.author.id);
  if (index < 0) return Promise.resolve();

  // eslint-disable-next-line
  const regex = new RegExp(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/, 'gm');

  if (regex.test(msg.content)) {
    if (msg.member.bannable) {
      msg.member.ban().then(() => {
        // @ts-ignore
        bot.channels.get(servers('main').channel('staff')).send(`Banned Spam: ${member.displayName}\nContent: ${msg.content}`);
        if (msg.deletable) msg.delete();
      });
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
bot.login(auth.token).then(() => {
  logger.info(`Logged in as: ${bot.user}`);
});
// bot.login(auth.token).then(() => {throw new Error()});

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

process.on('SIGINT', (event) => {
  stop();
  process.exit();
});
