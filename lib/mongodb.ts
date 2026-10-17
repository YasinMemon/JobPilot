import { MongoClient } from "mongodb";

const uri = process.env.DB_URI?.trim();

if (!uri) {
  throw new Error("Please define DB_URI in your .env");
}

if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
  throw new Error("DB_URI must start with mongodb:// or mongodb+srv://");
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
