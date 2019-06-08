const {cleantext} = require('./shared.js');

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

  item = item.toLowerCase();

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

  item = item.toLowerCase();

  if (item == 'sandwitch')
    return (display_card("Arkanin", options, bot));

  const {order} = require('../config/order.json');
  for (var key in order) {
    if (cleantext(key).indexOf(item) === 0) {
      return `${order[key]}`;
    }
  }

  return "Sorry, I don't have that";
}
