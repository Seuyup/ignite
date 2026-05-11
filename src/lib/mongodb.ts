import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  __igniteMongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.__igniteMongoose ?? {
  conn: null,
  promise: null,
};

if (process.env.NODE_ENV !== "production") {
  globalWithMongoose.__igniteMongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI가 설정되어 있지 않습니다. .env.local을 확인하세요.",
    );
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
