const faq = require('../config/faq.json');
const cr = require('../config/cr.json');

function f(q: string) {
  if (!q) {
    let response = '';
    for (const key in faq) {
      response += `${key}\n`;
    }
    return response;
  }

  for (var key in faq) {
    if (key.indexOf(q) === 0) {
      if (/^[0-9]/.test(faq[key])) {
        return `(${faq[key]}) ${cr[faq[key]]}`;
      }
      return `${faq[key]}`;
    }
  }

  return 'This might be a glossary term or you need to ask an experienced player.';
}

function c(q: string) {
  if (/^[0-9]/.test(q)) {
    if (cr[q]) return cr[q];
    else return `I don't have rule ${q} on hand. Please refer to the CR.`;
  }

  return 'That\'s not a section number, you can use !comprehensive for the full Comprehensive Rules';
}

export {
  c as cr,
  f as faq
}
