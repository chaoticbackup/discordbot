import { Client, Emoji, RichEmbed } from 'discord.js';
import { rndrsp } from '../../common';
import { API, color } from '../../database';
import { Attack, Card, Creature, Location, Mugic } from '../../definitions';
import Icons from '../../common/bot_icons';

export default function (name: string, options: string[], bot: Client) {
  const results = API.find_cards_by_name(name, options);

  if (results.length <= 0) {
    return "That's not a valid card name";
  }

  if (options.includes('text') || options.includes('ability')) {
    options.push('detailed');
  }

  // Random card
  if (!name) {
    return Response(rndrsp(results, 'card'), options, bot);
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
  // Not a released card
  if (!card.gsx$set) {
    if (card.gsx$image === '') {
      if (options.includes('detailed') || options.includes('read') || options.includes('stats')) {
        return 'No card data available';
      }

      return new RichEmbed()
      .setTitle(card.gsx$name)
      .setColor(color(card))
      .setDescription(card.gsx$ability || 'No data available')
      .setURL(API.base_image + card.gsx$splash)
      .setImage(API.base_image + card.gsx$splash);
    }
  }

  // Image only
  if (options.includes('image')) {
    return new RichEmbed()
    .setTitle(card.gsx$name)
    .setColor(color(card))
    .setURL(API.base_image + card.gsx$image)
    .setImage(API.base_image + card.gsx$image);
  }

  // Read ability only
  if (options.includes('read')) {
    if (options.includes('brainwashed') && (card as Creature).gsx$brainwashed) {
      return `${card.gsx$name}\n${(card as Creature).gsx$brainwashed}`;
    }
    else {
      return `${card.gsx$name}\n${card.gsx$ability}`;
    }
  }

  const icons = new Icons(bot);

  if (options.includes('stats')) {
    if (card.gsx$type === 'Creatures') {
      return new RichEmbed()
      .setTitle(card.gsx$name)
      .setColor(color(card))
      .setDescription(Stats({ icons, card, options, textOnly: false }))
      .setURL(API.base_image + card.gsx$image);
    }
    else return 'Only Creatures have stats';
  }

  // Formatting to include an image or just the card text
  const textOnly = Boolean(options.includes('detailed'));

  const mc = icons.mc((card as Creature | Mugic).gsx$tribe);
  const props = { card, options, icons, textOnly };

  /* Response Body */
  let body = TypeLine(props);

  if (textOnly && card.gsx$type === 'Mugic') {
    body += `${MugicAbility(mc, props)}\n\n`;
  }

  if (textOnly && card.gsx$type === 'Locations') {
    body += `Initiative: ${Initiative(props)}`;
  }

  if (textOnly && card.gsx$type === 'Attacks') {
    body += Elements(props);
  }

  body += Ability(card.gsx$ability, mc, props);

  if ((card as Creature).gsx$brainwashed) {
    body += `**Brainwashed**\n${Ability((card as Creature).gsx$brainwashed, mc, props)}`;
  }

  body += BuildRestrictions(props);

  if (textOnly && !options.includes('ability')) {
    body += FlavorText(props);
  }

  body += Stats(props);

  if (textOnly && card.gsx$type === 'Creatures') {
    body += Elements(props);
    body += ` | ${MugicAbility(mc, props)}`;
  }

  /* Card Embed */
  const CardMsg = new RichEmbed()
  .setTitle(card.gsx$name)
  .setURL(API.base_image + card.gsx$image)
  .setColor(color(card))
  .setDescription(body);

  if (!textOnly) {
    CardMsg
    .setImage(API.base_image + card.gsx$image);
  }

  return CardMsg;
}

const addNewLine = (entry: string, isText: boolean) => {
  if (entry !== '') {
    entry += (isText) ? '\n\n' : '\n';
  }
  return entry;
}

const Disciplines = (modstat = 0, props: props) => {
  const card = props.card as Creature;
  const { disciplines } = props.icons;

  /* eslint-disable no-eval */
  return `${
    eval(`${card.gsx$courage}+${modstat}`)}${disciplines('Courage')} ${
    eval(`${card.gsx$power}+${modstat}`)}${disciplines('Power')} ${
    eval(`${card.gsx$wisdom}+${modstat}`)}${disciplines('Wisdom')} ${
    eval(`${card.gsx$speed}+${modstat}`)}${disciplines('Speed')} | ${
    eval(`${card.gsx$energy}+${modstat / 2}`)}\u00A0E`;
}

const Stats = (props: props) => {
  const { card, options, textOnly } = props;

  let resp = '';
  if ((card as Creature).gsx$energy > 0) {
    let modstat = 0;
    if ((options.indexOf('max') > -1 || options.indexOf('thicc') > -1)
     && !(options.indexOf('min') > -1)) {
      modstat = 10;
    }
    if (options.indexOf('min') > -1 && !(options.indexOf('max') > -1)) {
      modstat = -10;
    }
    if (card.gsx$name === "Aa'une the Oligarch, Avatar") modstat = 0;
    resp += Disciplines(modstat, props);
  }

  return addNewLine(resp, textOnly);
}

const TypeLine = (props: props) => {
  const { card, textOnly, icons } = props;
  if (!textOnly) return '';
  let resp;

  if (card.gsx$type === 'Attacks') {
    resp = `${icons.attacks()
    } Attack - ${(card as Attack).gsx$bp} Build Points`;
  }
  else if (card.gsx$type === 'Battlegear') {
    resp = `${icons.battlegear()
    } Battlegear${card.gsx$types.length > 0 ? ` - ${card.gsx$types}` : ''}`;
  }
  else if (card.gsx$type === 'Creatures') {
    const tribe = (card as Creature).gsx$tribe;
    let types = card.gsx$types;
    let past = false;
    if (types.toLowerCase().includes('past')) {
      past = true;
      types = types.replace(/past /i, '');
    }
    resp = `${icons.tribes((card as Creature).gsx$tribe)
    } Creature - ${past ? 'Past ' : ''}${tribe === 'Generic' ? '' : `${tribe} `}${types}`;
  }
  else if (card.gsx$type === 'Locations') {
    resp = `${icons.locations()
    } Location${card.gsx$types.length > 0 ? ` - ${card.gsx$types}` : ''}`;
  }
  else if (card.gsx$type === 'Mugic') {
    resp = `${icons.tribes((card as Mugic).gsx$tribe)
    } Mugic - ${(card as Mugic).gsx$tribe}`;
  }
  else return '';

  return addNewLine(resp, true);
}

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
}

const Elements = (props: props) => {
  const { card } = props;
  const { elements, el_inactive } = props.icons;

  let resp = '';

  if (card.gsx$type === 'Creatures') {
    ['Fire', 'Air', 'Earth', 'Water'].forEach((element) => {
      if ((card as Creature).gsx$elements.includes(element)) {
        resp += `${elements(element)} `;
      }
      else {
        resp += `${el_inactive(element)} `;
      }
    });
    resp.trim();
  }
  else if (card.gsx$type === 'Attacks') {
    resp += `${(card as Attack).gsx$base} | `;
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
}

const MugicAbility = (mc: Emoji, props: props) => {
  const { card } = props;
  let amount: any = 0;
  let resp = '';

  if (card.gsx$type === 'Creatures') {
    amount = (card as Creature).gsx$mugicability;
    if (amount === 0 || amount === '0') return '';
  }
  else if (card.gsx$type === 'Mugic') {
    amount = (card as Mugic).gsx$cost;
    if (amount === 0 || amount === '0') return '0';
    if (amount === 'X') return 'X';
  }

  for (let i = 0; i < amount; i++) {
    resp += `${mc}`;
  }

  return resp;
}

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
    if (card.gsx$type === 'Creatures' && (card as Creature).gsx$tribe === "M'arrillian") {
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
}

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
}

const FlavorText = (props: props) => {
  const { card } = props;
  const resp = `*${card.gsx$flavortext}*`;
  if (resp !== '**') return addNewLine(resp, true);
  else return '';
}
