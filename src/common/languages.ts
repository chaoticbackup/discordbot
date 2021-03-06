const languages = {
  AR: ['‎عربى', 'Arabic'],
  CS: ['Čeština', 'Czech'],
  DE: ['Deutsche', 'German'],
  EN: ['English'],
  ES: ['Español', 'Spanish'],
  FR: ['Français', 'French'],
  HR: ['Hrvatski', 'Croatian'],
  IT: ['Italiano', 'Italian'],
  IW: ['‎עברית', 'Hebrew'],
  PT: ['Português', 'Portuguese'],
  SK: ['Slovenský', 'Slovak'],
  SR: ['Српски', 'Serbian']
};

export default languages;

export type lang_type = keyof typeof languages;
export function isLangType(t: string): t is lang_type {
  return Object.keys(languages).includes(t);
}

export function list(doc: Partial<Record<lang_type, Record<string, string>>>) {
  let message = '';
  (Object.entries(languages)).forEach(([lang, language]) => {
    if (!(lang in doc) || Object.keys(doc[lang]).length <= 0) return;
    const english = language.length > 1 ? ` (${language[1]})` : '';
    message += `**${language[0]}**${english}\n    ${lang} [`;

    for (const set in doc[lang]) {
      if (set === '_') continue;
      message += `${set}, `;
    }
    message = message.slice(0, -2);
    message += ']\n';
  });
  return message;
}

export function languageEnglish(t: lang_type): string {
  const language = languages[t];
  return language.length > 1 ? language[1] : language[0];
}
