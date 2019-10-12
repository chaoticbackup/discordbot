import path from 'path';
import fs from 'fs-extra';

const db_path = path.resolve(__dirname, "..", "..", "..", "db");

if (!fs.existsSync(db_path)) {
	fs.mkdirSync(db_path);
}

export default db_path;