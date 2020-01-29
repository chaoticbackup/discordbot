import { escape_text } from '../../common';
import { API } from '../../database';

/*
Find a list of names based on input
*/
export default function (name: string) {
  if (API.data === 'local') {
    return 'Database offline; unable to find cards by name';
  }

  if (name.length < 2) {
    return 'Use at least 2 characters';
  }

  const results = API.find_card_name(name);

  if (results.length === 0) {
    return 'No cards match this search';
  }

  let response = '';
  if (results.length > 15) response = 'First 15 matches:\n';
  results.splice(0, 15).forEach((card) => {
    response += `${card.gsx$name.replace(
      new RegExp(escape_text(name), 'i'), (match: string) => {
        return `**${match}**`;
      }
    )}\n`;
  });

  return response;
}
