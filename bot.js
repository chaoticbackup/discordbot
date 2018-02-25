var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var $;

require("jsdom/lib/old-api").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }
    $ = require("jquery")(window);
});

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
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            break;
            case 'pong':
                bot.sendMessage({
                    to: channelID,
                    message: 'yes?'
                });

            break;
            // Just add any case commands if you want to..
         }
     }
});

function checkMessages() {
    console.log("Checking Messages");
    $.get('http://chaoticbackup.forumotion.com')
    .done(function(data) {
        console.log(data);    
    })
    setTimeout(checkMessages, 60000);
}
