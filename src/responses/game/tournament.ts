/* eslint-disable no-prototype-builtins */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-for-in-array */

function match(list: Array<Array<number | string>>) {
  const matches: { [key: string]: string } = {};
  const outer: Array<Array<number | string>> = [];

  // Weigh and then sort the matchability ranking by inclusion in each other's list of opponents
  for (const i in list) {
    const temp = [];
    const low: number[] = [];

    for (const j in list) {
      temp.push(-1);
      const a = list[i].findIndex((e) => e == j);
      if (a < 0) continue;

      const b = list[j].findIndex((e) => e == i);
      if (b < 0) continue;

      temp[j] = Math.round((a + (0.1 * a) + b + (0.1 * b)) * 10) / 10;

      // Sort by weight (lowest first)
      if (low.length == 0) {
        low.push(Number(j));
        continue;
      }
      for (const h in low) {
        if (temp[j] < temp[h]) {
          low.splice(Number(h), 0, Number(j));
          break;
        }
      }
      // Place last element at end of array
      if (temp[j] > temp[low[low.length - 1]]) low.push(Number(j));
    }

    outer.push(low);
  }

  // Pair based on heighest mutual preferred opponent
  for (let depth = 0; depth < list.length - 1; depth++) {
    for (const i in outer) {
      if (!matches[i] && outer[i].length > depth) {
        const idx = outer[i][depth];

        if (!matches[idx] && outer[idx][0] == i) {
          matches[i] = idx.toString();
          matches[idx] = i;
          continue;
        }
      }
    }
  }

  // Match remaining candidates
  // Sort by highest amount of matches
  const remaining: string[] = [];
  for (const i in outer) {
    if (matches.hasOwnProperty(i)) continue;
    for (const j in remaining) {
      if (outer[i].length > outer[j].length) {
        remaining.splice(Number(j), 0, i);
        break;
      }
    }
    // Place last element at end of array
    if (remaining.length === 0 || outer[i].length < outer[remaining[remaining.length - 1]].length) {
      remaining.push(i);
    }
  }

  for (let i = 0; i <= remaining.length - 2; i += 2) {
    matches[remaining[i]] = remaining[i + 1];
  }

  // Output results
  const processed: string[] = [];
  let output = '';

  for (const [one, two] of Object.entries(matches)) {
    if (processed.includes(one)) continue;
    output += `${list[one][0]} vs ${list[two][0]}\n`;
    processed.push(two); // don't repeat the reversed matchup
  }

  if (remaining.length % 2 === 1) {
    output += `Bye: ${list[remaining[remaining.length - 1]][0]}`;
  }

  return output;
}

const list = [
  ['magesofthebeach', 1, 3, 4],
  ['kingmaxxor', 4, 3, 0],
  ['chiodosin', 1, 3, 4],
  ['agame', 1, 2, 0],
  ['zygris', 1, 2, 5],
  ['drosera', 4, 3, 2]
];

console.log(match(list));
