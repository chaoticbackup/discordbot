import { WithId } from 'mongodb';

import ScanQuest from '..';
import { SendFunction } from '../../definitions';
import { Server } from '../database';

export async function disable(this: ScanQuest, server: WithId<Server>, yes: boolean, send: SendFunction) {
  if (server.disabled) {
    if (yes) {
      return await send('This server is already disabled');
    }

    const res = await this.db.servers.updateOne(
      { id: server.id },
      {
        $set: { disabled: false }
      }
    );

    if (res.acknowledged) {
      await send('This server is now enabled');
      this.spawner.startTimer(server);
    }
    else {
      await send('failed to enable server');
    }
  }
  else {
    if (!yes) {
      return await send('This server is already enabled');
    }

    const res = await this.db.servers.updateOne(
      { _id: server._id },
      {
        $set: { disabled: true }
      }
    );

    this.spawner.clearTimeout(server.id);

    if (res.acknowledged) {
      await send('This server has been disabled');
    }
    else {
      await send('failed to disable server; but stopped spawn timer');
    }
  }
}
