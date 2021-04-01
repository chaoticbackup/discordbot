import { cleantext } from '../../common';
import glossary from './config/glossary.json';

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

  return 'I\'m not sure, you may need to check the Comprensive Rules:\n' +
      '<https://drive.google.com/file/d/1BFJ2lt5P9l4IzAWF_iLhhRRuZyNIeCr-/view>';
}
