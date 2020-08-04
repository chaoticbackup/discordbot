import { Card, Creature } from '../definitions';
import API from './Api';

// Seperating the export is important to maintain the singleton
const instance = API.getInstance();

/* Wrappers for imgur images */
instance.hasImage = (card: Card) => (
  Boolean(card.gsx$ic && card.gsx$ic !== '') ||
  Boolean(card.gsx$image && card.gsx$image !== '')
);

instance.hasAvatar = (card: Creature) => (
  Boolean(card.gsx$ia && card.gsx$ia !== '') ||
  Boolean(card.gsx$avatar && card.gsx$avatar !== '')
);

instance.hasFullart = (card: Card) => (
  Boolean(card.gsx$if && card.gsx$if !== '') ||
  Boolean(card.gsx$splash && card.gsx$splash !== '')
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
  } else if (card.gsx$avatar !== '') {
    return instance.base_image + card.gsx$avatar;
  } else {
    return instance.card_back;
  }
};

instance.cardFullart = (card: Card) => {
  if (card.gsx$if && card.gsx$if !== '') {
    return card.gsx$if;
  } else if (card.gsx$splash && card.gsx$splash !== '') {
    return instance.base_image + card.gsx$splash;
  } else {
    return instance.card_back;
  }
};

export default instance;
