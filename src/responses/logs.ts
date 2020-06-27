import fs from 'fs-extra';
import path from 'path';
import logger from '../logger';

const home_path = path.resolve(__dirname, '..', '..');

export default () => {
  try {
    let text = fs.readFileSync(path.resolve(home_path, 'out.log'), { encoding: 'utf8' }).toString().replace(/\\[3[29]m/g, '');
    if (text.length > 2000) {
      return text.slice(-2000);
    }

    if (fs.existsSync(path.resolve(home_path, 'out.old.log'))) {
      text = '==Old Log==\n'
        + `${fs.readFileSync(path.resolve(home_path, 'out.log'), { encoding: 'utf8' }).toString().replace(/\\[3[29]m/g, '')}`
        + '==New Log==\n'
        + `${text}`;
      if (text.length > 2000) {
        return text.slice(-2000);
      }
    }

    return text;
  }
  catch (e) {
    logger.error(e);
  }
};
