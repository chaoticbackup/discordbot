import { escape_text } from '../../common';
import { Card } from '../../definitions';

/*
Formated a list of names based on input and list of cards
*/
export default function found_card_list(name: string, results: Card[]) {
  if (results.length === 0) {
    return;
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
