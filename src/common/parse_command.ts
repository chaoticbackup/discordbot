/**
  * Turns the first 'word' after the command character into the `cmd`
  * Merges the remaining array of words into `args`
  * Strips `options` from string and returns as array
  */
export default function parseCommand(content: string):
 {cmd: string, args: string[], options: string[]}
{
  let result: string;

  if (content.charAt(1) === '!') {
    result = (content.substring(2));
  }
  else {
    result = (content.substring(1));
  }

  const cmd = result.split(' ')[0].toLowerCase();

  const options: string[] = [];
  result = result.replace(/(?:--|—)([^\s]+)([ \t]*)/g, (_match: any, p1: string) => {
    options.push(p1); return '';
  });

  // only looks at first line for input
  const args = result.split('\n')[0].trim().split(' ').splice(1);

  return { cmd, args, options };
}
