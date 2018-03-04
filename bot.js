var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client();

bot.on('ready', function (evt) {
  logger.info('Logged in as: ' + bot.user);
  console.log("Checking Messages");
  checkMessages();
});

// Automatically reconnect if the bot disconnects due to inactivity
bot.on('disconnect', (erMsg, code) => {
    bot.connect();
});
bot.on('message', (message) => {
  var user = message.author;
  if (user.bot) return; //Ignore's own messages
  var content = message.content;
  var channelID = message.channel.id;
  var mentions = Array.from(message.mentions.users.keys());

  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (content.substring(0, 1) == '!') {
    var args = content.substring(1).split(' ');
    var cmd = args[0].toLowerCase();
    args = args.splice(1);

    switch(cmd) {
      case 'ping':
        message.reply('Pong!');
        break;
      case 'pong':
        bot.channels.get(channelID).send('That\'s my role...');
        break;
      case 'ban':
        if (mentions.length > 0) {
          bot.channels.get(channelID).send("I'm not in charge of banning players");
          break;
        }
      case 'whyban':
        if (mentions.length > 0)
          bot.channels.get(channelID).send("Player's aren't cards, silly");
        else
          bot.channels.get(channelID).send(whyban(args));
        break;
      case 'banlist':
        bot.channels.get(channelID).send(banlist());
        break;
      case 'rule':
      case 'rules':
      case 'ruling':
        bot.channels.get(channelID).send(ruling(args));
        break;
      case 'combo':
      case 'comboswith':
        bot.channels.get(channelID).send(combo(args));
        break;
      case 'endofturn':
        bot.channels.get(channelID).send(ruling('6.4.1'));
        break;
    }
    return;
  }

  checkSass(content, channelID);

  checkMentions(mentions, channelID);

});

/* LOGIN */
bot.login(auth.token);

// Helper Functions
function reload(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

function rndrsp(items) {
  return items[Math.floor(Math.random()*items.length)];
}

function cleantext(string) {
  //strip comma and apostrophy
  return string.toLowerCase().replace(/,|\'/g, '');
}

// Responses
function banlist() {
  var bans = reload('./config/bans.json');
  var message = "This is our player-made ban list:\n=====";
  for (var key in bans) {
    message += "\n" + key;
  }
  message += "\n=====\nYou can ask me why a card was banned with \"!whyban *card name*\"";
  return message;
}

function whyban(card, mentions) {
  var bans = reload('./config/bans.json');
  card = cleantext(card.join(" ")); // remerge string

  if (!card) return rndrsp(["Specify a card...", "Yeah, just ban *everything*"]);

  for (var key in bans) {
    if (cleantext(key).indexOf(card) === 0)
      return `*${key}*:\n${rndrsp(bans[key])}`;
  }

  return rndrsp(["That card isn't banned. :D", `Oh lucky you, ${card} isn't banned`]);
}

function ruling(rule) {
  var rules = reload('./config/rules.json');
  var sass = reload('./config/sass.json');

  if (!rule) return rndrsp(sass["!providerule"]);

  if (rules.hasOwnProperty(rule)) return `${rules[rule]}`;

  return rndrsp(sass["!norule"]);
}

function checkSass(content, channelID) {
  var sass = reload('./config/sass.json');

  for (var key in sass) {
    if (content.match(new RegExp(key, "i"))) {
      bot.channels.get(channelID).send(rndrsp(sass[key]));
      return true;
    }
  }
  return false;
}

function combo(card) {
  var combos = reload('./config/combos.json');
  card = cleantext(card.join(" ")); // remerge string

  if (!card) return rndrsp(["Specify a card..."]);

  for (var key in combos) {
    if (cleantext(key).indexOf(card) === 0)
      return `*Here's are cards that work with ${key}*:\n${combos[key]}`;
  }

  return rndrsp(["I'm not aware of any combos. A more advanced player might know"]);
}

function checkMentions(mentions, channelID) {
  if (mentions.length <= 0) return;
  var sass = reload('./config/sass.json');

  // if (mentions.indexOf('140143063711481856') !== -1)
  if (mentions.indexOf('279331985955094529') !== -1)
    bot.channels.get(channelID).send(rndrsp(sass["!hello"]));

  if (mentions.indexOf('279788856285331457') !== -1)
    bot.channels.get(channelID).send('Don\'t @ the Oracle. He sees everything anyway');
}

var jsdom = require("jsdom");
var jquery = require("jquery");
const {JSDOM} = jsdom;
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console);

// config
var {forum} = require('./config/config.json');

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
};

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

  return new Date(year, month, day, hour, minute, (new Date()).getSeconds());
}

function newToday(date) {
  var time = date[date.length-2].split(":");
  var {hour, minute} = hm(date);

  var today = new Date();
  today.setHours(hour, minute);
  return today;
}

function checkMessages() {
  var {seconds, default_channel} = reload("./config/config.json");

  // Simulated Browser
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
        if ((currenttime - newToday(date))/1000 <= (seconds)) {
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
      bot.channels.get(default_channel).send(message);
    });

  });

  setTimeout(checkMessages, seconds*1000);
}

