import { cleantext } from '../../common';
import { order, make } from './config/menu.json';

export { _menu as menu, _make as make, _order as order };

const _menu = () => {
  let message = '**Port Court Menu**\n=====';
  for (const key in order) {
    message += `\n${key}`;
  }
  return message;
};

const _make = (item: string) => {
  if (!item) return 'My skillet is ready';
  item = cleantext(item);

  for (const key in make) {
    if (cleantext(key).indexOf(item) === 0) {
      return `${make[key]}`;
    }
  }
  return "I don't have that recipe";
};

const _order = (item: string) => {
  if(cleantext(item).includes("blugon burger")) {
      return ":hamburger:";
    }
  else if (!item) return 'What would you like to order?';
  item = cleantext(item);

  for (const key in order) {
    if (cleantext(key).indexOf(item) === 0) {
      return `${order[key]}`;
    }
  }
  return "Sorry, I don't have that. Use !menu";
};
