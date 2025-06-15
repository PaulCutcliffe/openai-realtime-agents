import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agents';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (!db) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
  }
  return db;
}

export async function insertFact(fact: string) {
  const database = await getDb();
  await database.collection('facts').insertOne({ fact, createdAt: new Date() });
}

export async function getAllFacts(): Promise<string[]> {
  const database = await getDb();
  const records = await database.collection('facts').find().toArray();
  return records.map((r: any) => r.fact as string);
}
