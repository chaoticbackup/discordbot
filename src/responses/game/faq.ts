const cr = require('../config/cr.json') as Record<string, string>;
const faq = require('../config/faq.json') as Record<string, string>;

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
  if (!/^[0-9]/.test(q)) {
    return 'That\'s not a section number, you can use !comprehensive for the full Comprehensive Rules';
  }

  if (
    (q.length === 1 && q !== '1') ||
    (q.endsWith('.*') && q.length <= 5)
  ) {
    return 'Please provide a more specific section';
  }
  else if (q.endsWith('.*')) {
    const section = subRule(q.slice(0, -2));
    if (section !== '') {
      if (section.length >= 2000) {
        return 'This section is too large to post as a whole';
      }
      return section;
    }
  }
  else {
    if (cr[q]) return cr[q];
  }

  return `I don't have rule ${q} on hand. Please refer to the CR.`;
}

function subRule(rule: string): string {
  if (cr[rule]) {
    let section = `${rule} ${cr[rule]}\n`;
    for (let i = 1; true; i++) {
      if (cr[`${rule}.${i}`]) {
        section += subRule(`${`${rule}.${i}`}`);
      }
      else {
        break;
      }
    }
    return section;
  }
  return '';
}

export {
  c as cr,
  f as faq
}
