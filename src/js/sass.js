const {rndrsp} = require('./shared.js');

export function checkSass(mentions, message) {
  const {sass, tags} = require('../config/sass.json');
  let content = message.content;

  for (var key in sass) {
    if (content.match(new RegExp(key, "i")))
      return rndrsp(sass[key]);
  }

  if (mentions.length <= 0) return;
  let response = "";

  // if (mentions.indexOf('140143063711481856') !== -1) //kingmaxor4

  if (mentions.indexOf('279788856285331457') !== -1) // Afjak
    return ('Don\'t @ the Oracle. He sees everything anyway');

  if (mentions.indexOf('279331985955094529') !== -1) {// ChaoticBacktalk
    if (content.match(new RegExp(/love/, "i"))) {
      response = `❤️ you too`;
    }
    else if (content.match(new RegExp(/did.+(king).+(make|create)/, "i"))) {
      response = (rndrsp(tags["daddy"]));
    }
    else if (content.match(new RegExp(/who.+(made|created)/, "i"))) {
      try {
        let displayname = this.guilds.get(message.guild.id).members.get("140143063711481856").displayName;
        response = `${displayname} taught me Chaotic`;
      }
      catch(err) {}
    }
    else {
      response = (rndrsp(tags["hello"], 'hello'));
    }
  }

  return response;
}
