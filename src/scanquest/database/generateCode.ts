import { Code } from '../../definitions';

import ScanQuestDB from '.';

export default async function (db: ScanQuestDB): Promise<Code> {
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
  } while (await db.usedcodes.findOne({ code: { $eq: code } }) !== null);

  const res = await db.usedcodes.insertOne({ code });

  if (res.acknowledged) {
    return code;
  }

  return await Promise.reject('Failed to update db');
}
