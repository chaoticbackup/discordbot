import { API } from '../database';
import { Logger } from 'winston';
import express from 'express';
const app = express();
const port = 3000;

export default (logger: Logger) => {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  app.get('/card/:cardName', (req, res) => {
    const name = decodeURI(req.params.cardName);
    const cards = API.find_cards_by_name(name, []);

    if (cards.length > 0) {
      const image = `${API.base_image}${cards[0].gsx$image}`;
      res.send({ image: image });
    }
    else {
      res.status(404).send('Card not found');
    }
  });

  app.listen(port, () => logger.info(`Card API listening on port ${port}`));
}
