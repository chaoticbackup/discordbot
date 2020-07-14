import languages, { isLangType, list } from '../../common/languages';
import episodes from './config/episodes.json';

export default function (args: string[], options: string[]) {
  if (options.includes('list')) {
    return list(episodes);
  }

  if (args.length < 1) return '!watch --help';

  const lang = args[0].toUpperCase();
  if (isLangType(lang) && lang in episodes) {
    let set;
    if (args.length < 2) {
      if ('_' in episodes[lang]) set = '_';
      else return '!watch <language> <season>';
    }
    else set = args[1].toUpperCase();
    if (set in episodes[lang]) {
      return `${episodes[lang][set]}`;
    }
    else {
      return `I don't have episodes in ${languages[lang][1]}`;
    }
  }
  else {
    return "I don't have episodes in that language";
  }
}
