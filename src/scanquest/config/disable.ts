import ScanQuest from '..';
import { Server } from '../database';
import { SendFunction } from '../../definitions';

export async function disable(this: ScanQuest, server: Server, yes: boolean, send: SendFunction) {
  if (server.disabled) {
    if (yes) {
      return await send('This server is already disabled');
    }

    server.disabled = false;
    this.db.servers.update(server);

    await send('This server is now enabled');

    this.spawner.startTimer(server);
  }
  else {
    if (!yes) {
      return await send('This server is already enabled');
    }

    this.spawner.clearTimeout(server);

    server.disabled = true;
    this.db.servers.update(server);

    await send('This server has been disabled');
  }
}
