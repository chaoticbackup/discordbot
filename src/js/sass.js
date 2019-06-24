const {rndrsp} = require('./shared.js');

export function checkSass(mentions, message) {
  const {sass, tags} = require('../config/sass.json');
  let content = message.content;

  if (mentions.length > 0)
    return checkMentions(mentions, mentions);

  if (content.match(/(end of combat|combat end|end of turn).*?\?/i)) {
    if (content.match(/indefinitely/)) {
      return "No, the ability only lasts until the end of turn.";
    }
    if (content.match(/element/)) {
      return "Creatures will regain their Scanned elements at the end of the turn";
    }
    return "Abilities last until the end of turn unless otherwise printed on the card.";
  }

  if (content.match(/(stack).*?\?/i)) {
    return "Yes, abilities with numerical quantities, (such as Strike, Elementproof, and Swift) are cumulative (stack).";
  }

  for (var key in sass) {
    if (content.match(new RegExp(key, "i")))
      return rndrsp(sass[key]);
  }

}

function checkMentions(mentions, message) {
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
