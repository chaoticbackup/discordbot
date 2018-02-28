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
bot.on('message', function (user, userID, channelID, message, evt) {
  if (user.bot) return;

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
      // Just add any case commands if you want to..
     }
   }
   
   if (message.match(/.*(chaotic).*(com).*(back).*/gi)) {
      bot.sendMessage({
        to: channelID,
        message: 'any day now'
      });
    }
    if (message.includes("any day now?")) {
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

function newDate(dateTime) {
  // Tue 27 Feb 2018 - 14:31
  var date = dateTime.split(" ");
  var time = date[date.length-2].split(":");

  var year = date[3];
  var month = monthTable[date[1]];
  var day = date[2].slice(0, -1);
  var hour = (function() {
    if (date[date.length-1] == "pm")
      return (time[0] < 12) ? time[0] + 12 : time[0];
    else
      return (time[0] == 12) ? time[0] - 12 : time[0];
  })();
  var minute = time[1];

  return new Date(year, month, day, hour, minute, (new Date).getSeconds());
}

function newToday(date) {
  var time = date[date.length-2].split(":");
  var hour = (function() {
    if (date[date.length-1] == "pm")
      return (time[0] < 12) ? time[0] + 12 : time[0];
    else 
      return (time[0] == 12) ? time[0] - 12 : time[0];
  })();
  var minute = time[1];

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
        console.log(currenttime, newToday(date));
        console.log((currenttime - newToday(date))/1000);
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

