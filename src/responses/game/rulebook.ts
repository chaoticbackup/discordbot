import { lang_type, isLangType, list, languageEnglish } from '../../common/languages';
import rulebook_json from './config/rulebooks.json';
const rulebooks = rulebook_json as Partial<Record<lang_type, Record<string, string>>>;

function rule_url(url: string) {
  return (`https://drive.google.com/file/d/${url}/view`);
}

export default function (args: string[], options: string[]) {
  if (options.includes('list')) {
    return list(rulebooks);
  }

  // Default is English AU
  if (args.length === 0) {
    return rule_url(rulebooks.EN!.AU);
  }

  const language = args[0].toUpperCase();
  if (isLangType(language) && language in rulebooks) {
    const lang = rulebooks[language]!;
    if (args.length === 1) {
      if ('AU' in lang) {
        return rule_url(lang.AU);
      }
      else {
        return rule_url(lang.DOP);
      }
    }
    else {
      const set = args[1].toUpperCase();
      if (set in lang) {
        return rule_url(lang[set]);
      }
      else {
        return `I don't have that set in ${languageEnglish(language)}`;
      }
    }
  }
  else {
    return "I don't have a rulebook in that language";
  }
}
