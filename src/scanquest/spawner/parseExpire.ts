import moment, { Moment } from 'moment';

const parseExpires = (oldExpires: Date, change: string): false | Moment => {
  let newExpires: Moment | undefined;
  let set: 'add' | 'sub' | 'set' | undefined;

  if (change.startsWith('+')) {
    set = 'add';
  }
  else if (change.startsWith('-')) {
    set = 'sub';
  }
  else if (change.startsWith('|')) {
    set = 'set';
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
      const regex_arr = (/[+-|](\d+[.]?\d?)[hm]?/).exec(change);
      if (regex_arr && regex_arr.length > 1) {
        const num = regex_arr[1];
        const unit = change.endsWith('m') ? 'minutes' : 'hours';

        if (set === 'add') {
          newExpires = moment(oldExpires).add(num, unit);
        }
        else if (set === 'sub') {
          newExpires = moment(oldExpires).subtract(num, unit);
        }
        else {
          newExpires = moment().add(num, unit);
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
