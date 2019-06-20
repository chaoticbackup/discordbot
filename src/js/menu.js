import {cleantext} from './shared';
import {display_card} from './database/card';

export function menu() {
  const {order} = require('../config/order.json');

  let message = "**Port Court Menu**\n=====";
  for (var key in order) {
    message += "\n" + key;
  }

  return message;
}

export function make(item) {
  if (!item) return 'My skillet is ready';

  const {make} = require('../config/order.json');
  for (var key in make) {
    if (cleantext(key).indexOf(item) === 0) {
      return `${make[key]}`;
    }
  }

  return "I don't have that recipe";
}

export function order(item) {
  if (!item) return 'What would you like to order?';

  const {order} = require('../config/order.json');
  for (var key in order) {
    if (cleantext(key).indexOf(item) === 0) {
      return `${order[key]}`;
    }
  }

  return "Sorry, I don't have that. Use !menu";
}
