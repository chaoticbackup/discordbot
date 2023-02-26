
const list = [
  ["magesofthebeach", 1, 3, 4],
  ["kingmaxxor", 4, 3, 0],
  ["chiodosin", 1, 3, 4],
  ["agame", 1, 2, 0],
  ["zygris", 1, 2, 5],
  ["drosera", 4, 3, 2]
];

function match() {
    const matches = {};
    const outer = [];

    // Weigh and then sort the matchability ranking by inclusion in each other's list of opponents
    for (let i in list) {
        let temp = [];
        let low = [];

        for (let j in list) {
            temp.push(-1);
            const a = list[i].findIndex((e) => e == j);
            if (a < 0) continue;

            const b = list[j].findIndex((e) => e == i);
            if (b < 0) continue;

            temp[j] = Math.round((a + (0.1 * a) + b + (0.1 * b)) * 10) /10;

            if (low.length == 0) low.push(Number(j));
            for (let h in low) {
              if (temp[j] < temp[h]) {
                low.splice(h, 0, Number(j));
                break;
              }
            }
        }

        outer.push(low);
    }

    console.log(outer)

    // Pair based on heighest mutual preferred opponent
    for (let depth = 0; depth < list.length - 1; depth++) {
      for (let i in outer) {
        if (!matches[i] && outer[i].length > depth) {
          let idx = outer[i][depth];

          if (!matches[idx] && outer[idx][0] == i) {
            matches[i] = idx.toString();
            matches[idx] = i;
            continue;
          }
        }
      }
    }

    
    // Match remaining candidates
    // TODO

    // Output results
    let processed = [];
    let output = "";

    for (let [one, two] of Object.entries(matches)) {
      if (processed.includes(one)) continue;
      output += `${list[one][0]} vs ${list[two][0]}\n`;
      processed.push(two); // don't repeat the reversed matchup
    }

    return output;
}

console.log(match());
