import fs from 'fs-extra';
import path from 'path';
import { Message } from 'discord.js';

const home_path = path.resolve(__dirname, '..', '..');

export default (message: Message) => {
  try {
    const text = fs.readFileSync(path.resolve(home_path, 'out.log'), { encoding: 'utf8' }).toString();
    if (text.length > 2000) {
      return text.slice(-2000);
    }
    return text;
  }
  catch {}
}