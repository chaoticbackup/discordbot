import { ScannableBattlegear, ScannedBattlegear } from './Battlegear';
import { ScannableCreature, ScannedCreature } from './Creature';
import { ScannableLocation, ScannedLocation } from './Location';
import { Scannable } from './Scannable';
import { Scanned } from './Scanned';

/**
 * @param scan Scanned to transform into Scannable
 */
export function toScannable(scan: Scanned): Scannable | undefined {
  switch (scan.type) {
    case 'Battlegear':
      return new ScannableBattlegear(scan as ScannedBattlegear);
    case 'Creatures':
      return new ScannableCreature(scan as ScannedCreature);
    case 'Locations':
      return new ScannableLocation(scan as ScannedLocation);
  }
}
