import {API} from './js';
import { Logger } from 'winston';
import express from 'express';
const port = 3000;

export default class CardAPI {
    app = express();
    logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    start() {
        // Check to see if database has been initialized
        if (!API.data) {
            // Try again in a second
            setTimeout(() => {this.start()}, 1000);
            return;
        }
        if (API.data === "local") return;
        
        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
          });
      
          this.app.get('/card/:cardName', (req, res) => {
              let name = decodeURI(req.params.cardName);
              let cards = API.find_cards_by_name(name, []);
      
              if (cards.length > 0) {
                  let image = API.base_image + cards[0].gsx$image;
                  res.send({image: image});
              }
              else {
                  res.status(404).send("Card not found");
              }
          });
      
          this.app.listen(port, () => this.logger.info('Card API listening on port ' + port));
    }
}


