import API from './Api';
export { default as color } from './card_color';

export const cards = require('./cards.json') as Record<string, string>;

// Seperating the export is important to maintain the singleton
const instance = API.getInstance();
export { instance as API };
