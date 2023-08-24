import { isLangType, lang_type } from './languages';

/**
  * Turns the first 'word' after the command character into the `cmd`
  * Merges the remaining array of words into `args`
  * Strips `options` from string and returns as array
  */
export default function parseCommand(content: string):
{ cmd: string, args: string[], options: string[], language: lang_type }
{
  let result: string;

  if (content.charAt(1) === '!') {
    result = (content.substring(2));
  }
  else {
    result = (content.substring(1));
  }

  // prevents the bot from being used to maliciously mention everyone
  result = result.replace(/@(here|everyone)/g, ' ');

  const cmd = result.split(' ')[0].toLowerCase();

  const options: string[] = [];
  let language: lang_type = 'EN';
  result = result.replace(/(?:--|—)(([\w]+="((\\")|([^"]))*")|([^\s]+))[\s]?/g, (_match: any, p1: string) => {
    if (isLangType(p1.toUpperCase())) {
      language = p1.toUpperCase() as lang_type;
    } else {
      options.push(p1);
    }
    return '';
  });

  // only looks at first line for input
  const args = result.split('\n')[0].trim().split(' ').splice(1);

  return { cmd, args, options, language };
}
