import { Creature } from '../../definitions';

export function smildon(stats: number[], card: Creature): number[] {
  const courage = (stats[0] - +card.gsx$courage) / 5;
  const power = (stats[1] - +card.gsx$power) / 5;
  const wisdom = (stats[2] - +card.gsx$wisdom) / 5;
  const speed = (stats[3] - +card.gsx$speed) / 5;
  const energy = (stats[4] - +card.gsx$energy) / 5;
  const total = ((energy * 1.5) + courage + power + wisdom + speed) / 5;

  return [courage, power, wisdom, speed, energy, total];
}
