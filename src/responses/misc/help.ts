import help from './config/help.json';

export default (str: string = '', keys: string[] = Object.keys(help)) => {
  let message = '';

  // detailed help
  if (str !== '') {
    if (str in help && help[str].long) {
      message = `\`\`\`md\n${
        help[str].cmd}\n\`\`\`${
        help[str].long}`;
    }
    else {
      message = "Sorry, I don't have additional information about that command";
    }
  }
  // help list
  else {
    keys.forEach((key) => {
      if ('short' in help[key]) {
        message += `\n${help[key].cmd}\n`;
        if (help[key].short !== '')
        { message += `> (${help[key].short})\n`; }
      }
    });
  }
  return message;
};
