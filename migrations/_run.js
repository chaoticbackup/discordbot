const path = require('path');
const fs = require('fs');

const args = process.argv;

const direction = args[2].toLowerCase();
const file = args[3];

if (direction === "up" || direction === "down") {
    const migration = path.resolve("./", file);
    if (fs.existsSync(migration)) {
        require(migration)[direction]();
    }
}

