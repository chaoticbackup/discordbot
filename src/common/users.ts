import { Snowflake, Message } from 'discord.js';

type name = keyof typeof usersList;

export default function users(name: name): Snowflake {
  if (usersList[name]) return usersList[name];
  else return '';
}

export function isUser(message: Message, arg1: name | name[]): boolean {
  let is = false;

  if (typeof arg1 === 'string') {
    is = (message.author.id === users(arg1));
  }
  else {
    arg1.forEach(user => {
      is = is || (message.author.id === users(user));
    });
  }

  return is;
}

const usersList = {
  me: '279331985955094529',
  daddy: '140143063711481856',
  afjak: '279788856285331457',
  brat: '275310967087300608',
  bf: '203721843520045056',
  metal: '262254930553864192',
  ferric: '848002323791347732',
  chio: '278751571112624131'
};
