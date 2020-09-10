import { ScannedBattlegear } from '../scan_type/Battlegear';
import { ScannedCreature } from '../scan_type/Creature';
import { ScannedLocation } from '../scan_type/Location';
import { Scanned } from '../scan_type/Scanned';
import ScanQuestDB from '../database';

/**
* This shouldn't be null unless error in json file
*/
export function load(type: string, content: string): Scanned | null {
  switch (type) {
    case 'Creatures': {
      try {
        const [name, ...stats] = content.split(/ (?=[0-9]+)/);
        if (stats.length !== 5) throw new Error();
        const [courage, power, wisdom, speed, energy] = stats.map((v) => parseInt(v));
        return new ScannedCreature(name, courage, power, wisdom, speed, energy);
      } catch {
        return null;
      }
    }
    case 'Battlegear': return new ScannedBattlegear(content);
    case 'Locations': return new ScannedLocation(content);
    default: return null;
  }
}

export default function (db: ScanQuestDB, args: string[]): string | undefined {
  const id = args[0];
  const type = args[1];
  const content = args.splice(1).join(' ');
  const info = content.substr(content.indexOf(' ') + 1);
  const card = load(type, info);
  if (card) {
    db.save(id, card).catch(() => {});
  } else {
    return ('!load <#id> <type> <name> [...stats]');
  }
}
