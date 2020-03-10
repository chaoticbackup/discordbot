import ScanQuestDB from './scan_db';
export type Code = string;

export function generateCode(db: ScanQuestDB): Code {
  // 0-9 A-F
  // 48-57 65-70
  let code = '';
  let digit = 0;
  do {
    while (digit < 12) {
      const rl = (Math.random() * (126 - 45 + 1)) + 45;
      if (
        (rl >= 48 && rl <= 57) || (rl >= 65 && rl <= 70)
      ) {
        code += `${rl}`;
        digit++;
      }
    }
  } while (db.usedcodes.find({ code: { $eq: code } }));

  db.usedcodes.insertOne({ code });

  return code;
}
