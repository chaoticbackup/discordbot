const faq = require('../config/faq.json');

export default function (q: string) {
  if (!q) {
    let response = '';
    for (const key in faq) {
      response += `${key}\n`;
    }
    return response;
  }

  for (var key in faq) {
    if (key.indexOf(q) === 0)
    { return `${faq[key]}`; }
  }

  return 'This might be a glossary term or you need to ask an experienced player.';
}
