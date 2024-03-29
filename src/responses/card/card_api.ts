import { Client, Emoji, RichEmbed } from 'discord.js';

import { rndrsp } from '../../common';
import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import {
  Card, Mugic, Location, Creature, isCreature, isMugic, isLocation, isAttack, isBattlegear
} from '../../definitions';

import found_card_list from './found_card_list';

export default function (name: string, options: string[], bot: Client): string | RichEmbed {
  let results = API.find_cards_ignore_comma(name, options);

  // Random card
  if (!name) {
    return Response(rndrsp(results, 'card'), options, bot);
  }

  if (results.length === 0) {
    results = API.find_card_name(name);

    if (results.length === 0) {
      return "That's not a valid card name";
    }

    else if (results.length > 1) {
      return found_card_list(name, results)!;
    }
  }

  return Response(results[0], options, bot);
}

interface props {
  card: Card
  options: string[]
  textOnly: boolean
  icons: Icons
}

function Response(card: Card, options: string[], bot: Client) {
  if (options.includes('detailed') || options.includes('ability')) {
    options.push('text');
  }

  // Not a released card
  if (!card.gsx$set) {
    if (!API.hasImage(card)) {
      if (options.includes('text') || options.includes('read') || options.includes('stats')) {
        return 'No card data available';
      }
      const url = API.cardFullart(card);
      return new RichEmbed()
        .setTitle(card.gsx$name)
        .setColor(color(card))
        .setDescription(card.gsx$ability || 'No data available')
        .setURL(url)
        .setImage(url);
    }
  }

  // Image only
  if (options.includes('image')) {
    return new RichEmbed()
      .setTitle(card.gsx$name)
      .setColor(color(card))
      .setURL(API.cardImage(card))
      .setImage(API.cardImage(card));
  }

  // Read ability only
  if (options.includes('read')) {
    if (options.includes('brainwashed') && isCreature(card) && card.gsx$brainwashed) {
      return `${card.gsx$name}\n${card.gsx$brainwashed}`;
    }
    else {
      return `${card.gsx$name}\n${card.gsx$ability}`;
    }
  }

  const icons = new Icons(bot);

  if (options.includes('stats')) {
    if (isCreature(card)) {
      return new RichEmbed()
        .setTitle(card.gsx$name)
        .setColor(color(card))
        .setDescription(Stats({ icons, card, options, textOnly: false }))
        .setURL(API.cardImage(card));
    }
    else return 'Only Creatures have stats';
  }

  // Formatting to include an image or just the card text
  const textOnly = Boolean(options.includes('text'));

  const mc = icons.mc((card as Creature | Mugic).gsx$tribe);
  const props = { card, options, icons, textOnly };

  /* Response Body */
  let body = TypeLine(props);

  if (textOnly && isMugic(card)) {
    body += `${MugicAbility(mc, props)}\n\n`;
  }

  if (textOnly && isLocation(card)) {
    body += `Initiative: ${Initiative(props)}`;
  }

  if (textOnly && isAttack(card)) {
    body += Elements(props);
  }

  if (card.gsx$ability) {
    body += Ability(card.gsx$ability, mc, props);
  }

  if (isCreature(card) && card.gsx$brainwashed) {
    body += `**Brainwashed**\n${Ability(card.gsx$brainwashed, mc, props)}`;
  }

  body += BuildRestrictions(props);

  if (textOnly && !options.includes('ability')) {
    body += FlavorText(props);
  }

  if (isCreature(card)) {
    body += Stats(props);
  }

  if (textOnly && isCreature(card) && !options.includes('ability')) {
    body += Elements(props);
    body += ` | ${MugicAbility(mc, props)}`;
  }

  /* Card Embed */
  const CardMsg = new RichEmbed()
    .setTitle(card.gsx$name)
    .setURL(API.cardImage(card))
    .setColor(color(card))
    .setDescription(body);

  if (!textOnly) {
    CardMsg
      .setImage(API.cardImage(card));
  }

  return CardMsg;
}

const addNewLine = (entry: string, isText: boolean) => {
  if (entry !== '') {
    entry += (isText) ? '\n\n' : '\n';
  }
  return entry;
};

const Disciplines = (props: props, modstat = 0) => {
  const card = props.card as Creature;
  const { disciplines } = props.icons;

  /* eslint-disable no-eval */
  return `${
    eval(`${card.gsx$courage}+${modstat}`)}${disciplines('Courage')} ${
    eval(`${card.gsx$power}+${modstat}`)}${disciplines('Power')} ${
    eval(`${card.gsx$wisdom}+${modstat}`)}${disciplines('Wisdom')} ${
    eval(`${card.gsx$speed}+${modstat}`)}${disciplines('Speed')} | ${
    eval(`${card.gsx$energy}+${modstat / 2}`)}\u00A0E`;
};

const Stats = (props: props) => {
  const { card, options, textOnly } = props;

  let resp = '';
  if ((card as Creature).gsx$energy > 0) {
    let modstat = 0;
    if ((options.includes('max') || options.includes('thicc'))
      && !(options.includes('min'))) {
      modstat = 10;
    }
    if (options.includes('min') && !(options.includes('max'))) {
      modstat = -10;
    }
    if (card.gsx$name === "Aa'une the Oligarch, Avatar") modstat = 0;
    resp += Disciplines(props, modstat);
  }

  return addNewLine(resp, textOnly);
};

const TypeLine = (props: props) => {
  const { card, textOnly, icons } = props;
  if (!textOnly) return '';
  let resp;

  if (isAttack(card)) {
    resp = `${icons.attacks()
    } Attack - ${card.gsx$bp} Build Points`;
  }
  else if (isBattlegear(card)) {
    resp = `${icons.battlegear()
    } Battlegear${card.gsx$types.length > 0 ? ` - ${card.gsx$types}` : ''}`;
  }
  else if (isCreature(card)) {
    let types = card.gsx$types;
    let past = false;
    if (types.toLowerCase().includes('past')) {
      past = true;
      types = types.replace(/past /i, '');
    }
    resp = `${icons.tribes(card.gsx$tribe)} Creature - ${past ? 'Past ' : ''}${types}`;
  }
  else if (isLocation(card)) {
    resp = `${icons.locations()
    } Location${card.gsx$types.length > 0 ? ` - ${card.gsx$types}` : ''}`;
  }
  else if (isMugic(card)) {
    resp = `${icons.tribes(card.gsx$tribe)
    } Mugic - ${card.gsx$tribe}`;
  }
  else return '';

  return addNewLine(resp, true);
};

const Ability = (cardtext: string, mc: Emoji, props: props) => {
  const { textOnly } = props;
  const { elements, disciplines } = props.icons;

  cardtext = cardtext.replace(/(\b((fire)|(air)|(earth)|(water))\b)/gi, (match, p1) => {
    return `${elements(p1)}${match}`;
  });

  cardtext = cardtext.replace(/(\b((courage)|(power)|(wisdom)|(speed))\b)/gi, (match, p1) => {
    return `${disciplines(p1)}${match}`;
  });

  cardtext = addNewLine(cardtext, textOnly);

  if (mc) return cardtext.replace(/\{\{MC\}\}/gi, mc.toString());
  else return cardtext.replace(/\{\{MC\}\}/gi, 'MC');
};

const Elements = (props: props) => {
  const { card } = props;
  const { elements, el_inactive } = props.icons;

  let resp = '';

  if (isCreature(card)) {
    ['Fire', 'Air', 'Earth', 'Water'].forEach((element) => {
      if (card.gsx$elements.includes(element)) {
        resp += `${elements(element)} `;
      }
      else {
        resp += `${el_inactive(element)} `;
      }
    });
    resp.trim();
  }
  else if (isAttack(card)) {
    resp += `${card.gsx$base} | `;
    ['Fire', 'Air', 'Earth', 'Water'].forEach((element) => {
      // @ts-ignore
      const dmg = card[`gsx$${element.toLowerCase()}`];
      if (dmg && dmg >= 0) {
        resp += `${elements(element)} ${dmg} `;
      }
      else {
        resp += `${el_inactive(element)} `;
      }
    });
    resp += '\n\n';
  }
  else return '';

  return resp;
};

const MugicAbility = (mc: Emoji, props: props) => {
  const { card } = props;
  let amount: any = 0;
  let resp = '';

  if (isCreature(card)) {
    amount = card.gsx$mugicability;
    if (amount === 0 || amount === '0') return '';
  }
  else if (isMugic(card)) {
    amount = card.gsx$cost;
    if (amount === 0 || amount === '0') return '0';
    if (amount === 'X') return 'X';
  }

  for (let i = 0; i < amount; i++) {
    resp += `${mc}`;
  }

  return resp;
};

const BuildRestrictions = (props: props) => {
  const { card, textOnly } = props;
  if (!textOnly) return '';

  let resp = '';
  if (card.gsx$loyal) {
    resp += '**';
    if (card.gsx$unique) {
      resp += 'Unique, ';
    }
    else if (card.gsx$legendary) {
      resp += 'Legendary, ';
    }
    resp += (card.gsx$loyal === '1' ? 'Loyal' : `Loyal - ${card.gsx$loyal}`);
    if (isCreature(card) && card.gsx$tribe === "M'arrillian") {
      resp += " - M'arrillians or Minions";
    }
    resp += '**';
  }
  else if (card.gsx$unique) {
    resp += '**Unique**';
  }
  else if (card.gsx$legendary) {
    resp += '**Legendary**';
  }

  return addNewLine(resp, textOnly);
};

export const Initiative = (props: props) => {
  const card = props.card as Location;
  const { elements, disciplines, tribes } = props.icons;

  const init = card.gsx$initiative
    .replace(/(\b((fire)|(air)|(earth)|(water))\b)/gi, (match, p1) => {
      return `${elements(p1)}${match}`;
    })
    .replace(/(\b((courage)|(power)|(wisdom)|(speed))\b)/gi, (match, p1) => {
      return `${disciplines(p1)}${match}`;
    })
    .replace(/(\b((overworld)|(underworld)|(danian)|(mipedian)|(m'arrillian))\b)/gi, (match, p1) => {
      return `${tribes(p1)}${match}`;
    });

  return addNewLine(init, true);
};

const FlavorText = (props: props) => {
  const { card } = props;
  const resp = `*${card.gsx$flavortext}*`;
  if (resp !== '**') return addNewLine(resp, true);
  else return '';
};
