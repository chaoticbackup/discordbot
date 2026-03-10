import express from 'express';
import { exec } from 'child_process';

import { API } from '../database';
import logger from '../logger';

const app = express();
const port = 3000;

const killPort = (port: number) => {
  return new Promise<void>((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9`, (error) => {
      // Ignore errors, as the port might not be in use
      resolve();
    });
  });
};

export default async () => {
  await killPort(port);

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  app.get('/card/:cardName', (req, res) => {
    const name = decodeURI(req.params.cardName);
    const cards = API.find_cards_by_name(name);

    if (cards.length > 0) {
      const image = API.cardImage(cards[0]);
      res.send({ image });
    }
    else {
      res.status(404).send('Card not found');
    }
  });

  const server = app.listen(port, () => logger.info(`Card API listening on port ${port}`));
  return server;
};
