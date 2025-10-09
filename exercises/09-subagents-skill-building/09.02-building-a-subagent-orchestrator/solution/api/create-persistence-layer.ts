import { promises as fs } from 'fs';
import path, { join } from 'path';

const stringifyForDatabase = (data: unknown) => {
  return JSON.stringify(data, null, 2);
};

export const createPersistenceLayer = <TDatabaseShape>(opts: {
  databasePath: string;
  defaultDatabase: TDatabaseShape;
}) => {
  async function ensureDatabaseExists(): Promise<void> {
    const dataDir = join(
      process.cwd(),
      path.dirname(opts.databasePath),
    );
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {
      // Do nothing - directory already exists
    }

    try {
      await fs.access(opts.databasePath);
    } catch {
      // Write the default database
      await fs.writeFile(
        opts.databasePath,
        stringifyForDatabase(opts.defaultDatabase),
      );
    }
  }

  async function loadDatabase(): Promise<TDatabaseShape> {
    await ensureDatabaseExists();
    try {
      await fs.access(opts.databasePath);
    } catch {
      await fs.writeFile(opts.databasePath, '{}');
    }

    const data = await fs.readFile(opts.databasePath, 'utf-8');
    return JSON.parse(data) as TDatabaseShape;
  }

  async function saveDatabase(
    data: TDatabaseShape,
  ): Promise<void> {
    await fs.writeFile(
      opts.databasePath,
      stringifyForDatabase(data),
    );
  }

  async function updateDatabase(
    mutator: (data: TDatabaseShape) => void,
  ): Promise<void> {
    const data = await loadDatabase();
    mutator(data);
    await saveDatabase(data);
  }

  return {
    loadDatabase,
    updateDatabase,
  };
};
