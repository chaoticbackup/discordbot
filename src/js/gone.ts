import {Client, RichEmbed} from 'discord.js';
import {cleantext, rndrsp} from './common';
const {GoneChaotic, Gone2Chaotic, GoneChaotic3} = require("../config/gonechaotic.json");

export default function(name: string, bot: Client) {

  
    let merge = Object.assign({}, GoneChaotic, Gone2Chaotic, GoneChaotic3);
  
    if (name==="nakan") {
      let line = ""
        + "88" + bot.emojis.find(emoji => emoji.name==="Courage").toString() + " "
        + "76" + bot.emojis.find(emoji => emoji.name==="Power").toString() + " "
        + "23" + bot.emojis.find(emoji => emoji.name==="Wisdom").toString() + " "
        + "41" + bot.emojis.find(emoji => emoji.name==="Speed").toString() + " "
        + "| " + "59" + " E";
  
      return new RichEmbed()
        .setTitle("Nakan")
        .setURL(merge["Nakan"])
        .setDescription(line)
        .setImage(merge["Nakan"]);
    }
  
    if (name) {
      for (var key in merge) {
        if (cleantext(key).indexOf(name) === 0) {
          return new RichEmbed()
            .setTitle(key)
            .setURL(merge[key])
            .setImage(merge[key]);
        }
      }
      return rndrsp(["Yokkis can't find your card", "I guess that card isn't *gone*"]);
    }
  
    let card = rndrsp(Object.keys(merge));
    return new RichEmbed()
      .setTitle(card)
      .setURL(merge[card])
      .setImage(merge[card]);
}