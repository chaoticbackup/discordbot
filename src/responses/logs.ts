import fs from 'fs-extra';
import path from 'path';

const home_path = path.resolve(__dirname, '..', '..');

export default () => {
  try {
    const text = fs.readFileSync(path.resolve(home_path, 'out.log'), { encoding: 'utf8' }).toString().replace(/\\[3[29]m/g, '');
    if (text.length > 2000) {
      return text.slice(-2000);
    }
    return text;
  }
  catch (e) {
    console.error(e);
  }
}
