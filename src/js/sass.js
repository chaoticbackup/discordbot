const {rndrsp} = require('./shared.js');

export function checkSass(mentions, message) {
  const {sass, tags} = require('../config/sass.json');
  let content = message.content;

  if (mentions.length > 0)
    return checkMentions(mentions, message);

  if (content.match(/indefinitely/)) {
    return "No, the ability only lasts until the end of turn.";
  }

  if (content.match(/(end of combat|combat end|end of turn).*?\?/i)) {
    if (content.match(/(fire|water|earth|air|element)/i)) {
      return "Creatures will regain their Scanned elements at the end of the turn";
    }
    if (content.match(/(stats|disciplines|energy)/i)) {
      return "Creature's disciplines and energy are reset to their Scanned values at the end of the turn. Any innate modifiers are reapplied.";
    }
    return "Abilities last until the end of turn unless otherwise printed on the card.";
  }

  if (content.match(/(stack|cumulative).*?\?/i)) {
    const myreg = new RegExp("(((element|water|fire|air|earth)(proof)?|intimidate\s?(energy|courage|wisdom|power|speed)?|(outperform|exaust)\s?(energy|courage|wisdom|power|speed)?|strike|swift|support|recklessness)\s?[0-9x]*)", "i");
    if (content.match(myreg)) {
      let match = myreg.exec(content);
      return "Yes, " + match[1] + " stacks.";
    }
    if (content.match(/hive/i)) {
      return "Abilities granted by hive stack.";
    }
    return "No, only abilities with numerical quantities are cumulative (stack). Current examples of cumulative abilities are: Strike, Recklessness, Intimidate, Element X, Elementproof, Exhaust, Outperform, Support, and Swift";
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
