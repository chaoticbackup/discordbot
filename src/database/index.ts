import API from './Api';
export { default as color } from './card_color';

// This is important to maintain the singleton
const instance = API.getInstance();
export { instance as API };
