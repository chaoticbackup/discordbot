import { cleantext } from '../../common';
const glossary = require('../config/glossary');

export default function (rule: string) {
  rule = rule.replace(/^(at )*(the )/i, '')
    .replace(/(abilities)$/i, 'ability')
    .replace(/(creatures)/i, 'creature');

  for (const key in glossary) {
    if (cleantext(key).indexOf(cleantext(rule)) === 0) {
      let value = glossary[key];
      if (value.indexOf('See') === 0) {
        value = glossary[value.match(/See \"(.*)\"/i)[1]];
      }
      return `*${key}*:\n${value}`;
    }
  }

  return 'I\'m not sure, but you can check the Player Guide:\n' +
      '<https://docs.google.com/document/d/1WJZIiINLk_sXczYziYsizZSNCT3UUZ19ypN2gMaSifg/view>';
}
