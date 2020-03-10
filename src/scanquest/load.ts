import { BattlegearScan, ScannableBattlegear } from './scannable/Battlegear';
import { CreatureScan, ScannableCreature } from './scannable/Creature';
import { LocationScan, ScannableLocation } from './scannable/Location';
import { Scannable } from './scannable/Scannable';

/**
* This shouldn't be null unless error in json file
*/
export default function (lastSpawn: {type: string, info: any}): Scannable | null {
  if (lastSpawn.type === 'Creatures') {
    const crScan = new CreatureScan();
    try {
      [crScan.name, crScan.courage, crScan.power,
        crScan.wisdom, crScan.speed, crScan.energy
      ] = lastSpawn.info.split(/ (?=[0-9]+)/);
      return new ScannableCreature(crScan);
    } catch {}
    return null;
  }
  else if (lastSpawn.type === 'Battlegear') {
    const bgScan = new BattlegearScan();
    bgScan.name = lastSpawn.info;
    return new ScannableBattlegear(bgScan);
  }
  else if (lastSpawn.type === 'Locations') {
    const locScan = new LocationScan();
    locScan.name = lastSpawn.info;
    return new ScannableLocation(locScan);
  }

  return null;
}
