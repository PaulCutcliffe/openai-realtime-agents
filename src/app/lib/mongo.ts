import { MongoClient, Db } from 'mongodb';

// Connection URI should not include a default database so we can specify our own
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// Database and collection names used to store witness interview data
const dbName = process.env.MONGODB_DB || 'WitnessInterviews';
const collectionName = process.env.MONGODB_COLLECTION || 'FactsAndClaims';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (!db) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return db as Db;
}

export async function insertFact(fact: string) {
  const database = await getDb();
  await database.collection(collectionName).insertOne({ fact, createdAt: new Date() });
}

export async function getAllFacts(): Promise<string[]> {
  const database = await getDb();
  const records = await database.collection(collectionName).find().toArray();
  return records.map((r: any) => r.fact as string);
}
