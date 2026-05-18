import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const URI_FILE = join(__dirname, '.mongo-uri');

let mongoServer: MongoMemoryServer | undefined;

export async function startMongoMemory(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  writeFileSync(URI_FILE, uri, 'utf-8');
}

export async function stopMongoMemory(): Promise<void> {
  await mongoServer?.stop();
  mongoServer = undefined;
}

export function applyMongoMemoryUri(): void {
  if (process.env.MONGO_URI) {
    return;
  }

  if (existsSync(URI_FILE)) {
    process.env.MONGO_URI = readFileSync(URI_FILE, 'utf-8').trim();
  }
}
