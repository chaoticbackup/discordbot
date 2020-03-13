import { Snowflake } from 'discord.js';

export default function (name: string): Snowflake {
  const user = users[name];
  if (user) return user;
  else return '';
}

const users: Record<string, string> =
{
  me: '279331985955094529',
  daddy: '140143063711481856',
  afjak: '279788856285331457',
  brat: '275310967087300608'
};
