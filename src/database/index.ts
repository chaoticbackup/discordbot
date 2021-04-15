import cards_json from './cards.json';

export { default as API } from './ApiWrapper';
export { default as color } from './card_color';

export const cards = cards_json as Record<string, string>;
