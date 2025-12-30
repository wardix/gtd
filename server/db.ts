import { MongoClient, Db } from 'mongodb'

let db: Db | null = null
let client: MongoClient | null = null

export async function connectDB(): Promise<Db> {
  if (db) return db

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gtd'

  try {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db()
    console.log('✅ Connected to MongoDB')
    return db
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.')
  }
  return db
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close()
    db = null
    client = null
    console.log('MongoDB connection closed')
  }
}
