import { isLangType, languageEnglish, lang_type, list } from '../../common/languages';

import episodes_json from './config/episodes.json';
const episodes = episodes_json as Partial<Record<lang_type, Record<string, string>>>;

export default function (args: string[], options: string[]) {
  if (options.includes('list')) {
    return list(episodes);
  }

  if (args.length < 1) return '!watch --help';

  const language = args[0].toUpperCase();
  if (isLangType(language) && language in episodes) {
    const lang = episodes[language]!;
    let set;
    if (args.length < 2) {
      if ('_' in lang) set = '_';
      else return '!watch <language> <season>';
    }
    else set = args[1].toUpperCase();
    if (set in lang) {
      return `${lang[set]}`;
    }
    else {
      return `I don't have episodes in ${languageEnglish(language)}`;
    }
  }
  else {
    return "I don't have episodes in that language";
  }
}
