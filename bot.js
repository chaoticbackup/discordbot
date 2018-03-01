var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

var jsdom = require("jsdom");
var jquery = require("jquery");
const {JSDOM} = jsdom;
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console);

// config
var forum = "http://chaoticbackup.forumotion.com";

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(bot.username + ' - (' + bot.id + ')');

  checkMessages();
});
// Automatically reconnect if the bot disconnects due to inactivity
bot.on('disconnect', function(erMsg, code) {
    bot.connect();
});
bot.on('message', function (user, userID, channelID, message, evt) {
  if (userID == 279331985955094529) return; //Ignore's own messages

  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.substring(0, 1) == '!') {
    var args = message.substring(1).split(' ');
    var cmd = args[0].toLowerCase();
     
    args = args.splice(1);

    switch(cmd) {
      case 'ping':
        bot.sendMessage({
          to: channelID,
          message: 'Pong!'
        });
        break;
      case 'pong':
        bot.sendMessage({
          to: channelID,
          message: 'That\'s my role...'
        });
        break;
      case '6.4.1':
      case 'endofturn':
        bot.sendMessage({
          to: channelID,
          message: "6.4.1. The last step in a player’s turn is the Recovery Step. During the Recovery Step, the following events occur simultaneously:\n" +
            "1.) All damage is removed from Creatures in play.\n" +
            "2.) All effects that last “until end of turn” end. Any effects which are not tracked by an innate ability or counter and don’t have a specified duration also end now. All such effects end simultaneously and cannot result in a Creature being destroyed."
        });
        break;
    }
  }
   
  if (message.match(/.*(chaotic).*(com).*(back).*/i)) {
    bot.sendMessage({
      to: channelID,
      message: 'any day now'
    });
  }
  if (message.toLowerCase().includes("any day now?")) {
    bot.sendMessage({
      to: channelID,
      message: '***ANY*** day now'
    });
  }
});

var monthTable = {
  "Jan": 0,
  "Feb": 1,
  "Mar": 2,
  "Apr": 3,
  "May": 4,
  "Jun": 5,
  "Jul": 6,
  "Aug": 7,
  "Sep": 8,
  "Oct": 9,
  "Nov": 10,
  "Dec": 11
}

function hm(date) {
  var h12 = date[date.length-1];
  var time = ((h12=="am"||h12=="pm") ? date[date.length-2] : date[date.length-1]).split(":");
  var hour, minute;

  if (h12 == "pm")
    hour = (time[0] < 12) ? time[0] + 12 : time[0];
  else if (h12 == "am")
    hour = (time[0] == 12) ? time[0] - 12 : time[0];
  else {
    hour = time[0];
  }
  minute = time[1];

  return {hour: hour, minute: minute};
}

function md(date) {
  var month, day;
  if (date[date.length-2] == "-") {
    month = monthTable[date[2]];
    day = date[1];
  }
  else {
    month = monthTable[date[1]];
    day = date[2].slice(0, -1);
  }
  return {month: month, day: day};
}

function newDate(dateTime) {
  // Tue 27 Feb 2018 - 14:31
  var date = dateTime.split(" ");

  var year = date[3];

  var {hour, minute} = hm(date);
  var {month, day} = md(date);

  return new Date(year, month, day, hour, minute, (new Date).getSeconds());
}

function newToday(date) {
  var time = date[date.length-2].split(":");
  var {hour, minute} = hm(date);

  var today = new Date();
  today.setHours(hour, minute);
  return today;
}

function checkMessages() {
  console.log("Checking Messages");
  var {seconds, general_chat} = require("./config.json");

  JSDOM.fromURL(forum, {
    virtualConsole
  })
  .then(function(dom) {
    const window = dom.window;
    // const document = dom.window.document;
    // const bodyEl = document.body;
    // console.log(dom.serialize());

    var $ = jquery(window);

    var currenttime = newDate($('.current-time').contents().text().split("is ")[1]);

    // List of new posts
    var news = [];

    // Latest posts
    var latest = $('.row1 span');

    var dates = latest.contents().filter(function() {
      return this.nodeType === 3; //Node.TEXT_NODE
    });

    dates.each( function( index, element ) {
      var date = ($( this ).text()).split(" ");

      if (date[0] == "Yesterday") return;
      else if (date[0] == "Today") {
        if ((currenttime - newToday(date))/1000 <= (seconds+20)) {
          news.push(latest[index]);
        }
      }
      else return;
    });

    news.forEach(function(newPost, i) {
      var link = forum + ($(newPost).children().filter('a.last-post-icon').attr('href'));
      var author = ($(newPost).children().filter('strong').children().children().children().text());
      var topic = ($(newPost).children().filter('a').first().text());

      var message = author+" posted on \""+topic+"\" -> "+link;
      console.log(message);
      bot.sendMessage({
        to: general_chat,
        message: message
      });
    });

  });

  setTimeout(checkMessages, seconds*1000);
}

