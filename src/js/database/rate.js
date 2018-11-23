const API = require('./database.js').default;

export function rate_card(text, options, bot) {
  try {
    var name = text.split(/\s\d.*/g)[0];
    var stats = text.match(/\d+/g).map(Number);
    if (!stats || stats.length != 5) throw "";
  } catch (err) {
    return "!rate <Creature> <Courage> <Power> <Wisdom> <Speed> <Energy>";
  }

  let results = API.find_cards_by_name(name);
  if (results.length <= 0) {
    return "That's not a valid card name";
  }
  let card = results[0];
  if (card.gsx$type != "Creatures") return `${card.gsx$name} is not a Creature`;

  let error = "";

  if (stats[0] > Number(card.gsx$courage) + 10 || stats[0] < Number(card.gsx$courage) - 10) {
    error += `Courage must be between ${Number(card.gsx$courage) - 10} and ${Number(card.gsx$courage) + 10}\n`;
  }
  if (stats[1] > Number(card.gsx$power) + 10 || stats[1] < Number(card.gsx$power) - 10) {
    error += `Power must be between ${Number(card.gsx$power) - 10} and ${Number(card.gsx$power) + 10}\n`;
  }
  if (stats[2] > Number(card.gsx$wisdom) + 10 || stats[2] < Number(card.gsx$wisdom) - 10) {
    error += `Wisdom must be between ${Number(card.gsx$wisdom) - 10} and ${Number(card.gsx$wisdom) + 10}\n`;
  }
  if (stats[3] > Number(card.gsx$speed) + 10 || stats[3] < Number(card.gsx$speed) - 10) {
    error += `Speed must be between ${Number(card.gsx$speed) - 10} and ${Number(card.gsx$speed) + 10}\n`;
  }
  if (stats[4] > Number(card.gsx$energy) + 5 || stats[4] < Number(card.gsx$energy) - 5) {
    error += `Energy must be between ${Number(card.gsx$energy) - 5} and ${Number(card.gsx$energy) + 5}\n`;
  }

  if (error) return error;

  let courage = (stats[0] - card.gsx$courage) / 5;
  let power = (stats[1] - card.gsx$power) / 5;
  let wisdom = (stats[2] - card.gsx$wisdom) / 5;
  let speed = (stats[3] - card.gsx$speed) / 5;
  let energy = (stats[4] - card.gsx$energy) / 5;

  let total = ((energy*1.5)+courage+power+wisdom+speed)/5;

  return (
    bot.emojis.find(emoji => emoji.name=="Courage") + " " + courage + "\n" +
    bot.emojis.find(emoji => emoji.name=="Power") + " " + power + "\n" +
    bot.emojis.find(emoji => emoji.name=="Wisdom") + " " + wisdom + "\n" +
    bot.emojis.find(emoji => emoji.name=="Speed") + " " + speed + "\n" +
    "| E |  " + energy + "\n" +
    "Total Rating: " + total
  );
}
