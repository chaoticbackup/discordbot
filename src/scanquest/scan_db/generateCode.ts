import { Code } from '../definitions';
import ScanQuestDB from '.';

export default function (db: ScanQuestDB): Code {
  // 0-9 A-F
  // 48-57 65-70
  let code = '';
  do {
    code = '';
    let digit = 0;
    while (digit < 12) {
      const rl = Math.floor(Math.random() * (126 - 45 + 1)) + 45;
      if (
        (rl >= 48 && rl <= 57) || (rl >= 65 && rl <= 70)
      ) {
        code += String.fromCharCode(rl);
        digit++;
      }
    }
  } while (db.usedcodes.find({ code: { $eq: code } }).length > 0);

  db.usedcodes.insertOne({ code });

  return code;
}
