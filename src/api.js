const API = require('./js/database/database.js').default;
const express = require('express');
const app = express()
const port = 3000;

module.exports = function(logger) {
    // Initialize card API
    // Disabled if api.json is missing or set to false
    try {
        const api = require('./api.json');
        if (api == false) return;
    }
    catch (e) {
        return;
    }

    app.get('/card/:cardName', (req, res) => {
        res.send('Hello World!');
        console.log(req);
    });

    app.listen(port, () => logger.info('Card API listening on port ' + port));
}


