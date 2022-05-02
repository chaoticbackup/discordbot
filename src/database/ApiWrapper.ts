import { Card, Creature } from '../definitions';

import API from './Api';

// Seperating the export is important to maintain the singleton
const instance = API.getInstance();

/* Wrappers for imgur images */
instance.hasImage = (card: Card) => (
  Boolean(card.gsx$ic !== undefined && card.gsx$ic !== '') ||
  Boolean(card.gsx$image !== undefined && card.gsx$image !== '')
);

instance.hasAvatar = (card: Creature) => (
  Boolean(card.gsx$ia !== undefined && card.gsx$ia !== '') ||
  Boolean(card.gsx$avatar !== undefined && card.gsx$avatar !== '')
);

instance.hasFullart = (card: Card) => (
  Boolean(card.gsx$if !== undefined && card.gsx$if !== '') ||
  Boolean(card.gsx$splash !== undefined && card.gsx$splash !== '') ||
  Boolean(card.gsx$alt !== undefined && card.gsx$alt !== '') ||
  Boolean(card.gsx$alt2 !== undefined && card.gsx$alt2 !== '')
);

instance.cardImage = (card: Card) => {
  if (card.gsx$ic && card.gsx$ic !== '') {
    return card.gsx$ic;
  } else if (card.gsx$image && card.gsx$image !== '') {
    return instance.base_image + card.gsx$image;
  } else {
    return instance.card_back;
  }
};

instance.cardAvatar = (card: Creature) => {
  if (card.gsx$ia && card.gsx$ia !== '') {
    return card.gsx$ia;
  } else if (card.gsx$avatar && card.gsx$avatar !== '') {
    return instance.base_image + card.gsx$avatar;
  } else {
    return instance.card_back;
  }
};

// Check if fullart or if requesting alt. If no fullart check if alternative art exists before returning logo
instance.cardFullart = (card: Card, options: string[] = []) => {
  let url = '';

  if (options.includes('alt')) {
    if (card.gsx$alt) {
      url = card.gsx$alt;
    }
  }
  else if (options.includes('alt2')) {
    if (card.gsx$alt2) {
      url = card.gsx$alt2;
    }
  }
  else if (card.gsx$if && card.gsx$if !== '') {
    url = card.gsx$if;
  }
  else if (card.gsx$splash && card.gsx$splash !== '') {
    url = instance.base_image + card.gsx$splash;
  }
  else {
    if (card.gsx$alt) {
      url = card.gsx$alt;
    }
    else {
      url = instance.card_back;
    }
  }

  // Workaround for inconsistent data
  if (!url.startsWith('http')) {
    url = instance.base_image + url;
  }

  return url;
};

export default instance;
