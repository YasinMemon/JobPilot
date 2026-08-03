import { MongoClient } from "mongodb";

const uri = process.env.DB_URI!;

if (!uri) {
  throw new Error("Please define DB_URI in your .env");
}

const globalForMongo = global as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

const client = new MongoClient(uri);

const clientPromise = globalForMongo.mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClientPromise = clientPromise;
}

export default clientPromise;
