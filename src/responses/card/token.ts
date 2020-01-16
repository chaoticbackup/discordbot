import { API } from '../../database';

/**
* @param name The name of a token to return
*/
export default function (name: string) {
  /* Potential input formats
        parasite orange
        parasite_orange
        parasite orange 1
        parasite orange1
        parasite_orange 1
        parasite_orange1 // ideal
    */

  if (!name) return;

  name = name.replace(/[^a-z0-9 _]/i, '').trimRight();

  if (!/.*[0-9]$/.test(name)) {
    name += '1';
  }
  else {
    name = name.replace(/(.*)[ ]+([0-9])$/, '$1$2');
  }

  name = name.replace(/[ ]+/, '_');

  if (tokens[name]) {
    return API.base_image + tokens[name];
  }
}

const tokens = {
  parasite_orange1: '0B6oyUfwoM3u1MVBISVVNZnVuOGc',
  parasite_blue1: '0B6oyUfwoM3u1dDAxWUpranN5SHc',
  parasite_orange2: '0B6oyUfwoM3u1RVZrV0FTTms1YkU',
  parasite_blue2: '0B6oyUfwoM3u1T0Rnb3JVc1hCeTQ'
} as {
    [index: string]: string;
}
