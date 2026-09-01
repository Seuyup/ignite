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

// 서버리스(Vercel Functions)에서는 인스턴스가 재사용될 때 커넥션을 물려받도록
// 프로덕션에서도 전역에 캐시한다.
globalWithMongoose.__igniteMongoose = cached;

let indexesCleaned = false;

async function cleanBadIndexes(): Promise<void> {
  if (indexesCleaned) return;
  indexesCleaned = true;
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const listCollection = db.collection("list");
    const indexes = await listCollection.indexes();
    const badIndex = indexes.find(
      (idx) => idx.name === "menu_id_1" && idx.unique === true,
    );
    if (badIndex) {
      await listCollection.dropIndex("menu_id_1");
      console.log("[mongodb] dropped bad unique index: menu_id_1 on list");
    }
  } catch {
    /* ignore */
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI가 설정되어 있지 않습니다. .env.local을 확인하세요.",
    );
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      // 서버리스는 인스턴스가 여러 개 뜨므로 인스턴스당 풀을 작게 유지한다.
      maxPoolSize: 5,
      bufferCommands: false,
      serverSelectionTimeoutMS: 20000,
    });
  }
  cached.conn = await cached.promise;
  await cleanBadIndexes();
  return cached.conn;
}
