export function rulebook(args, options) {
  const {languages, rulebook} = require('../config/commands.json');

  let message = "";
  if (options.includes("list")) {
    for (let lan in languages) {
      message += `**${languages[lan]}**\n    ${lan} [`;

      for (let set in rulebook[lan]) {
        message += `${set}, `;
      }
      message = message.slice(0, -2);
      message += ']\n';
    };
    return message;
  }

  function rule_url(url) {
    return ("https://drive.google.com/file/d/" + url + "/view");
  }

  // Default is English AU
  if (!args) {
    return rule_url(rulebook["EN"]["AU"]);
  }

  args = args.split(' ');

  let lang = args[0].toUpperCase();
  if (rulebook.hasOwnProperty(lang)) {
    if (args.length === 1) {
      if (rulebook[lang].hasOwnProperty("AU")) {
        return rule_url(rulebook[lang]["AU"]);
      }
      else {
        return rule_url(rulebook[lang]["DOP"]);
      }
    }
    else {
      let set = args[1].toUpperCase();
      if (rulebook[lang].hasOwnProperty(set)) {
        return rule_url(rulebook[lang][set]);
      }
      else {
        return "I don't have that set in " + languages[lang];
      }
    }
  }
  else {
    return "I don't have a rulebook in that language";
  }

}
