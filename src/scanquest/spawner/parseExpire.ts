import moment, { Moment } from 'moment';

const parseExpires = (oldExpires: Date, change: string): false | Moment => {
  let newExpires: Moment | undefined;
  let set: 'add' | 'sub' | undefined;

  if (change.startsWith('+')) {
    set = 'add';
  }
  else if (change.startsWith('-')) {
    set = 'sub';
  }

  try {
    if (set === undefined) {
      if (change === 'now') {
        newExpires = moment();
      }
      else {
        const t = moment(change);
        if (t.isValid()) {
          newExpires = t;
        }
      }
    }
    else {
      const regex_arr = (/[+-](\d+[.]?\d?)[hm]?/).exec(change);
      if (regex_arr && regex_arr.length > 1) {
        const num = regex_arr[1];
        if (change.endsWith('m')) {
          if (set === 'add') {
            newExpires = moment(oldExpires).add(num, 'minutes');
          }
          else {
            newExpires = moment(oldExpires).subtract(num, 'minutes');
          }
        }
        else {
          if (set === 'add') {
            newExpires = moment(oldExpires).add(num, 'hours');
          }
          else {
            newExpires = moment(oldExpires).subtract(num, 'hours');
          }
        }
      }
    }
  }
  catch {
    return false;
  }

  if (newExpires === undefined) {
    return false;
  }

  return newExpires;
};

export default parseExpires;
