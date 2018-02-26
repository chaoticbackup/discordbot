var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

var jsdom = require("jsdom");
var jquery = require("jquery");
const {JSDOM} = jsdom;
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console);

var seconds = 60;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
// var bot = new Discord.Client({
//    token: auth.token,
//    autorun: true
// });

// bot.on('ready', function (evt) {
//   logger.info('Connected');
//   logger.info('Logged in as: ');
//   logger.info(bot.username + ' - (' + bot.id + ')');

  checkMessages();
// });
// bot.on('message', function (user, userID, channelID, message, evt) {
//   // Our bot needs to know if it will execute a command
//   // It will listen for messages that will start with `!`
//   if (message.substring(0, 1) == '!') {
//     var args = message.substring(1).split(' ');
//     var cmd = args[0];
     
//     args = args.splice(1);
//     switch(cmd) {
//       // !ping
//       case 'ping':
//         bot.sendMessage({
//           to: channelID,
//           message: 'Pong!'
//         });
//       break;
//       case 'pong':
//         bot.sendMessage({
//           to: channelID,
//           message: 'yes?'
//         });

//       break;
//       // Just add any case commands if you want to..
//      }
//    }
// });


function checkMessages() {
  console.log("Checking Messages");
  JSDOM.fromURL("http://chaoticbackup.forumotion.com", {
    virtualConsole
  })
  .then(function(dom) {
    const window = dom.window;
    // const document = dom.window.document;
    // const bodyEl = document.body;

    // console.log(dom.serialize());

    var $ = jquery(window);
    console.log($('.row1 span'));

  });



  // setTimeout(checkMessages, seconds*1000);
}

