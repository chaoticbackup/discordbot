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

    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    app.get('/card/:cardName', (req, res) => {
        let name = decodeURI(req.params.cardName)
        let cards = API.find_cards_by_name(name, []);

        if (cards.length > 0) {
            let image = API.base_image + cards[0].gsx$image;
            res.send({image: image});
        }
        else {
            res.status(404).send("Card not found");
        }
    });

    app.listen(port, () => logger.info('Card API listening on port ' + port));
}


