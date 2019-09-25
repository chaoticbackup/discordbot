import {cleantext} from './shared';
const {order, make} = require ('../config/menu.json');

export {
  _menu as menu,
  _make as make,
  _order as order
}

const _menu = () => {
  let message = "**Port Court Menu**\n=====";
  for (let key in order) {
    message += "\n" + key;
  }
  return message;
}

const _make = (item: string) => {
  if (!item) return 'My skillet is ready';
  for (let key in make) {
    if (cleantext(key).indexOf(item) === 0) {
      return `${make[key]}`;
    }
  }
  return "I don't have that recipe";
}

const _order = (item: string) => {
  if (!item) return 'What would you like to order?';
  for (let key in order) {
    if (cleantext(key).indexOf(item) === 0) {
      return `${order[key]}`;
    }
  }
  return "Sorry, I don't have that. Use !menu";
}
