import { cleantext } from '../../common';
import { lang_type } from '../../common/languages';

import glossary_en from './config/glossary.en.json';
import glossary_es from './config/glossary.es.json';

const supported_language_list = ['EN', 'ES'] as const;
type language = (typeof supported_language_list)[number];

function isSupportedLanguage(lang: string): lang is language {
  return supported_language_list.includes(lang as language);
}

const glossary: { [key in language]: { [key: string]: string } } = {
  EN: glossary_en,
  ES: glossary_es
};

const replace_term: { [key in language]: string } = {
  EN: 'See',
  ES: 'Mira'
};

export default function (rule: string, lang: lang_type = 'EN') {
  if (!isSupportedLanguage(lang)) lang = 'EN';

  if (lang === 'EN') {
    rule = rule.replace(/^(at )*(the )/i, '')
      .replace(/(abilities)$/i, 'ability')
      .replace(/(creatures)/i, 'creature');
  }

  const replace_rgx = new RegExp(`^${replace_term[lang]} \"(.*)\"`, 'i');

  for (const key in glossary[lang]) {
    if (cleantext(key).indexOf(cleantext(rule)) === 0) {
      let value = glossary[lang][key];
      if (value.indexOf(replace_term[lang]) === 0) {
        value = glossary[lang][value.match(replace_rgx)![1]];
      }
      return `*${key}*:\n${value}`;
    }
  }

  return 'I\'m not sure, you may need to check the Comprensive Rules:\n' +
      '<https://drive.google.com/file/d/1BFJ2lt5P9l4IzAWF_iLhhRRuZyNIeCr-/view>';
}
