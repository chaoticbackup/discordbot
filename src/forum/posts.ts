import { JSDOM, VirtualConsole } from 'jsdom';
import jquery from 'jquery';
import { Client, RichEmbed } from 'discord.js';
import servers from '../common/servers';
const virtualConsole = new VirtualConsole();
virtualConsole.sendTo(console);

const config = {
  seconds: 120,
  default_channel: servers('main').channel('gen_1'),
  test_channel: servers('develop').channel('gen'),
  forum: 'http://chaoticbackup.forumotion.com',
  expire: 10
}

function hm(date: string[]) {
  const h12 = date[date.length - 1];
  const time = ((h12 == 'am' || h12 == 'pm') ? date[date.length - 2] : date[date.length - 1]).split(':');
  let hour, minute;

  if (h12 == 'pm')
  { hour = (parseInt(time[0]) < 12) ? parseInt(time[0]) + 12 : parseInt(time[0]); }
  else if (h12 == 'am')
  { hour = (parseInt(time[0]) == 12) ? parseInt(time[0]) - 12 : parseInt(time[0]); }
  else {
    hour = parseInt(time[0]);
  }
  minute = parseInt(time[1]);

  return {hour: hour, minute: minute};
}

const monthTable: any = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11
};

function md(date: string[]) {
  let month, day;
  if (date[date.length - 2] == '-') {
    month = monthTable[date[2]];
    day = date[1];
  }
  else {
    month = monthTable[date[1]];
    day = date[2].slice(0, -1);
  }
  return {month: month, day: parseInt(day)};
}

function newDate(dateTime: string): Date {
  // Tue 27 Feb 2018 - 14:31
  const date = dateTime.split(' ');
  const year = parseInt(date[3]);
  const {month, day} = md(date);
  const {hour, minute} = hm(date);

  return new Date(year, month, day, hour, minute);
}

function post_time_diff(date: string[], currenttime: Date) {
  const post_time = new Date(currenttime.getTime());
  const {hour, minute} = hm(date);
  post_time.setHours(hour, minute);
  return (currenttime.getTime() - post_time.getTime());
}

export default class ForumPosts {
    bot: Client;
    channel: string;
    links: string[] = [];
    timeout: NodeJS.Timeout;

    constructor(bot: Client) {
      this.bot = bot;
      this.channel = (process.env.NODE_ENV != 'development') ? config.default_channel : config.test_channel;
    }

    start() {
      this.checkMessages();
    }

    stop() {
      clearTimeout(this.timeout);
    }

    expiredLink(id: string): boolean {
      if (this.links.includes(id)) return true;
      this.links.push(id)
      setTimeout(
        () => { this.links.shift() },
        config.expire * 60 * 1000
      );
      return false;
    }

    checkMessages() {
      // Simulated Browser
      JSDOM.fromURL(
        config.forum,
        {virtualConsole}
      )
        .then((dom) => {
          // const document = dom.window.document;
          // const bodyEl = document.body;
          // console.log(dom.serialize());
          const $ = jquery(dom.window, true);

          // List of new posts
          const newPosts: HTMLElement[] = [];

          const currenttime = newDate($('.current-time').contents().text().split('is ')[1]);

          // Latest posts
          const latest = $('.row1 > span');

          latest.contents()
            // Node.TEXT_NODE
            .filter((index, element) => element.nodeType === 3)
            .each((index, element) => {
              const date = ($(element).text()).split(' ');
              if (date.length <= 1) return;

              if (date[0] == 'Yesterday') return; // midnight misses
              if (date[0] == 'Today') {
                if ((post_time_diff(date, currenttime)) / 1000 <= (config.seconds)) {
                  newPosts.push(latest[index]);
                }
              }
            });

          newPosts.forEach((newPost, i) => {
            const topicurl = ($(newPost).children().filter('a.last-post-icon').attr('href'));

            if (!topicurl) return;
            const id = topicurl.split('-')[0];

            // ignore subsequent notifications per post
            if (this.expiredLink(id)) return;

            const fullurl = config.forum + topicurl;
            const author = ($(newPost).find('span > strong').text());
            const topic = ($(newPost).find('a').first().attr('title'));
            const message = new RichEmbed()
              .setTitle('New Forum Post')
              .setDescription(`${author} posted on [${topic}](${fullurl})`);

            // @ts-ignore bot will always be defined
            this.bot.channels.get(this.channel).send(message);
          });
        });

      this.timeout = setTimeout(() => { this.checkMessages() }, config.seconds * 1000);
    }
}
