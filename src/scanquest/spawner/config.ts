/**
 * @tick seconds in milliseconds
 * @debounce minutes in milliseconds
 * @safety minutes
 * @activity_window minutes in milliseconds
 */
const config = {
  tick: 1.8 * 1000,
  debounce: 2 * 60 * 1000,
  safety: 10,
  activity_window: 15 * 60 * 1000
};

export default config;
