/**
 * One-time Migration Script: Local MongoDB → MongoDB Atlas
 * Run with: node migrate.js
 */

import mongoose from "mongoose";

const LOCAL_URI = "mongodb://127.0.0.1:27017/studyflow";
const ATLAS_URI = "mongodb://gauravgarg1307:Anshul%40007@ac-lmo9tim-shard-00-00.wcdglcr.mongodb.net:27017,ac-lmo9tim-shard-00-01.wcdglcr.mongodb.net:27017,ac-lmo9tim-shard-00-02.wcdglcr.mongodb.net:27017/studyflow?ssl=true&replicaSet=atlas-ccebpb-shard-0&authSource=admin&appName=StduyFlow";

async function migrate() {
  console.log("🔌 Connecting to Local MongoDB...");
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("✅ Connected to Local MongoDB");

  console.log("☁️  Connecting to MongoDB Atlas...");
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log("✅ Connected to MongoDB Atlas");

  // Get all collection names from local DB
  const collections = await localConn.db.listCollections().toArray();
  console.log(`\n📦 Found ${collections.length} collections: ${collections.map(c => c.name).join(', ')}\n`);

  for (const col of collections) {
    const name = col.name;
    const localCollection = localConn.db.collection(name);
    const atlasCollection = atlasConn.db.collection(name);

    const docs = await localCollection.find({}).toArray();

    if (docs.length === 0) {
      console.log(`⏭️  Skipping '${name}' — empty`);
      continue;
    }

    // Clear existing data in Atlas for this collection before inserting
    await atlasCollection.deleteMany({});
    await atlasCollection.insertMany(docs);
    console.log(`✅ Migrated '${name}' — ${docs.length} documents`);
  }

  console.log("\n🎉 Migration complete! All local data is now in Atlas.");
  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
