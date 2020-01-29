import { cleantext } from '../../common';
const glossary = require('../config/glossary');

export default function (rule: string) {
  rule = rule.replace(/^(at )*(the )/i, '');

  for (var key in glossary) {
    if (cleantext(key).indexOf(cleantext(rule)) === 0)
    { return `*${key}*:\n${glossary[key]}`; }
  }

  return 'I\'m not sure, but you can check the Player Guide:\n' +
      '<https://docs.google.com/document/d/1WJZIiINLk_sXczYziYsizZSNCT3UUZ19ypN2gMaSifg/view>';
}
