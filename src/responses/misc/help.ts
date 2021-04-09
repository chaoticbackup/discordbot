const help = require('./config/help.js') as Record<string, {
  cmd?: string
  list?: string
  details?: string
  alias?: string
  mod?: boolean
}>;

export default (str: string = '', keys: string[] = Object.keys(help)) => {
  // detailed help
  if (str !== '') {
    if (str in help) {
      if (help[str].details) {
        return `\`\`\`md\n${
          help[str].cmd}\n\`\`\`${
          help[str].details}`;
      }
      else {
        return "Sorry, I don't have additional information about that command";
      }
    }
    else {
      return "That's not a command I can perform";
    }
  }
  // help list
  else {
    let message = '\n' +
      '**Command Help Syntax Explaination**\n' +
      '> < > notate a user input paramater (these are order dependant)\n' +
      "> a parmater in single quotes ' ' means that literal text(s) is required\n" +
      "> a pipe | notates that either option within ' ' or < > can be used\n" +
      '> a paramater in brackets [] means that it is optional\n' +
      '> [] with ellipses ... notates that any number of that paramater can be used\n' +
      '> command options that have -- can be used anywhere within the syntax and are not order dependant\n' +
      '```md';

    keys.forEach((key) => {
      if ('list' in help[key]) {
        message += `\n${help[key].cmd}\n`;
        if (help[key].list !== '') {
          message += `> (${help[key].list})\n`;
        }
      }
    });
    message += '```' +
      'I try to be helpful, but can be sassy. I may also pop in to add a quip ;)\n' +
      'You can ask me more about specific commands ``c!help <command>``.';

    return message;
  }
};
