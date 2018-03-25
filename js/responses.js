const {reload, rndrsp, cleantext} = require('./shared.js');
const rules = require('./rules.js');

module.exports = function(message) {
	var user = message.author;
	if (user.bot) return; //Ignore bot messages
	var content = message.content;
	var channelID = message.channel.id;
	var mentions = Array.from(message.mentions.users.keys());

	const bot = this;

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
	      bot.channels.get(channelID).send(rules(args));
	      break;
	    case 'combo':
	    case 'comboswith':
	      bot.channels.get(channelID).send(combo(args));
	      break;
	    case 'endofturn':
	      bot.channels.get(channelID).send(rules('6.4.1'));
	      break;
	    case 'source':
	      bot.channels.get(channelID).send(rules('8.2.3.5'));
	      break;
	    case 'errata':
	    	bot.channels.get(channelID).send(errata(args));
	    	break;
	  }
	  return;
	}

	var rsp = checkSass(content);
	if (rsp) bot.channels.get(channelID).send(rsp);

	checkMentions.call(bot, mentions, channelID);
}

// Responses
function banlist() {
  const {bans, watchlist} = reload('../config/bans.json');
  let message = "**Player-made Ban List:**\n=====";
  for (var key in bans) {
    message += "\n" + key;
  }
  message += "\n=====\n**Watchlist:**"
  for (var key in watchlist) {
  	message += "\n" + key;
  }
  message += "\n=====\nYou can ask me why a card was banned with \"!whyban *card name*\"";
  return message;
}

function whyban(card, mentions) {
  card = cleantext(card.join(" ")); // remerge string

  if (!card) return banlist();

  const {bans, watchlist} = reload('../config/bans.json');

  let merge = Object.assign({}, bans, watchlist);
  for (var key in merge) {
    if (cleantext(key).indexOf(card) === 0)
      return `*${key}*:\n${rndrsp(merge[key])}`;
  }

  return rndrsp(["That card isn't banned. :D", `Oh lucky you, ${card} isn't banned`]);
}

function errata(args) {
	return "You can check errata's here:\nhttps://drive.google.com/file/d/1eVyw_KtKGlpUzHCxVeitomr6JbcsTl55/view";
}

function checkSass(content) {
  var sass = reload('../config/sass.json');

  for (var key in sass) {
    if (content.match(new RegExp(key, "i")))
      return rndrsp(sass[key]);
  }
}

function combo(card) {
  var combos = reload('../config/combos.json');
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
  var bot = this;
  var sass = reload('../config/sass.json');

  // if (mentions.indexOf('140143063711481856') !== -1)
  if (mentions.indexOf('279331985955094529') !== -1)
    bot.channels.get(channelID).send(rndrsp(sass["!hello"]));

  if (mentions.indexOf('279788856285331457') !== -1)
    bot.channels.get(channelID).send('Don\'t @ the Oracle. He sees everything anyway');
}
