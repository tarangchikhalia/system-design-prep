import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'system-design-prep.db');
const db = new Database(DB_PATH);

const SEED_CHALLENGES = [
  {
    challenge_name: 'Design a URL Shortener',
    description: 'Design a scalable URL shortening service like bit.ly that can handle millions of requests per day, support custom aliases, and provide analytics.',
    difficulty: 'easy',
    topics: ['hashing', 'databases', 'caching'],
  },
  {
    challenge_name: 'Design a Rate Limiter',
    description: 'Design a distributed rate limiter that can throttle API requests per user or IP, supporting sliding window and token bucket algorithms.',
    difficulty: 'medium',
    topics: ['distributed systems', 'redis', 'algorithms'],
  },
  {
    challenge_name: 'Design Twitter',
    description: 'Design the core features of Twitter: posting tweets, following users, and generating a personalized home timeline with low latency at massive scale.',
    difficulty: 'hard',
    topics: ['distributed systems', 'caching', 'databases', 'message queues'],
  },
  {
    challenge_name: 'Design a Key-Value Store',
    description: 'Design a distributed key-value store similar to Redis or DynamoDB, supporting get/set/delete with high availability and partition tolerance.',
    difficulty: 'hard',
    topics: ['distributed systems', 'consistency', 'replication'],
  },
  {
    challenge_name: 'Design a Notification Service',
    description: 'Design a scalable push notification system that can deliver millions of notifications per minute to mobile and web clients with delivery guarantees.',
    difficulty: 'medium',
    topics: ['message queues', 'push notifications', 'scalability'],
  },
  {
    challenge_name: 'Design a File Storage System',
    description: 'Design a cloud file storage service like Google Drive or Dropbox, supporting file upload/download, versioning, and real-time sync across devices.',
    difficulty: 'medium',
    topics: ['storage', 'distributed systems', 'synchronization'],
  },
];

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_name TEXT NOT NULL,
      description    TEXT NOT NULL,
      difficulty     TEXT NOT NULL,
      topics         TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL,
      started_at   TEXT    NOT NULL,
      ended_at     TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  INTEGER NOT NULL,
      role        TEXT    NOT NULL,
      content     TEXT    NOT NULL,
      has_diagram INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL
    )
  `);

  const count = (db.prepare('SELECT COUNT(*) as count FROM challenges').get() as { count: number }).count;
  if (count === 0) {
    const insert = db.prepare(
      'INSERT INTO challenges (challenge_name, description, difficulty, topics) VALUES (?, ?, ?, ?)'
    );
    const insertMany = db.transaction((challenges: typeof SEED_CHALLENGES) => {
      for (const c of challenges) {
        insert.run(c.challenge_name, c.description, c.difficulty, JSON.stringify(c.topics));
      }
    });
    insertMany(SEED_CHALLENGES);
  }
}

export default db;
