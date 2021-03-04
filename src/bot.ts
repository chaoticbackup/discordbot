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
    sq.start();
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
  checkSpam(msg);
  responses(bot, msg);
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
      const meebot = member.guild.members.get('159985870458322944');
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

const link_regex = new RegExp(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/, 'gm');
const checkSpam = async (msg: Discord.Message) => {
  if (!msg.guild || msg.guild.id !== servers('main').id) return;
  const index = newMembers.indexOf(msg.author.id);
  if (index < 0) return;

  if (!msg.content.includes('chaoticrecode') && link_regex.test(msg.content)) {
    if (msg.member.kickable) {
      await msg.member.kick('Posted link as first message. Typically spam bot behavior.')
      .then(async () => {
        const channel = bot.channels.get(servers('main').channel('staff')) as Channel;
        return await channel.send(`Kicked suspected spam: ${msg.member.displayName}\nContent: ||${msg.content}||`);
      })
      .then(() => { if (msg.deletable) msg.delete(); });
    }
  }

  newMembers.splice(index, 1);
};

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
