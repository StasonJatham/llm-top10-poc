'use server'

import Database from 'better-sqlite3'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Message, type Chat } from '@/lib/types'

const db = new Database('./local.db', { verbose: console.log })

// Create tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    activation_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    user_id TEXT NOT NULL,
    messages TEXT NOT NULL,
    share_path TEXT,
    topic TEXT,
    mode TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`)

export const validateMessages = (messages: Message[]) => {
  return messages.filter(message => message.role && message.content)
}

// Function to get all chats for a user
export async function getChats(userId?: string | null) {
  const session = await auth()

  if (!userId || !session?.user) {
    return []
  }

  if (userId !== session.user.id) {
    return { error: 'Unauthorized' }
  }

  const stmt = db.prepare(
    'SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC'
  )
  const chats = stmt.all(userId) as Chat[]

  return chats
}

// Function to get a specific chat
export async function getChat(id: string, userId: string) {
  const session = await auth()

  if (!session?.user || userId !== session.user.id) {
    return { error: 'Unauthorized' }
  }

  const stmt = db.prepare('SELECT * FROM chats WHERE id = ? AND user_id = ?')
  const chat = stmt.get(id, userId) as Chat | undefined
  return chat || null
}

// Function to remove a chat
export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const uidStmt = db.prepare('SELECT user_id FROM chats WHERE id = ?')
  const chat = uidStmt.get(id) as { user_id: string } | undefined

  if (!chat || chat.user_id !== session.user.id) {
    return { error: 'Unauthorized' }
  }

  const deleteStmt = db.prepare('DELETE FROM chats WHERE id = ?')
  deleteStmt.run(id)

  revalidatePath('/')
  return revalidatePath(path)
}

// Function to clear all chats for a user
export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  const deleteStmt = db.prepare('DELETE FROM chats WHERE user_id = ?')
  deleteStmt.run(session.user.id)

  revalidatePath('/')
  return redirect('/')
}

// Function to get a shared chat
export async function getSharedChat(id: string) {
  const stmt = db.prepare('SELECT * FROM chats WHERE id = ?')
  const chat = stmt.get(id) as Chat | undefined

  if (!chat || !chat.share_path) {
    return null
  }

  return chat
}

// Function to share a chat
export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  const stmt = db.prepare('SELECT * FROM chats WHERE id = ? AND user_id = ?')
  const chat = stmt.get(id, session.user.id) as Chat | undefined

  if (!chat) {
    return { error: 'Something went wrong' }
  }

  const sharePath = `/share/${chat.id}`
  const updateStmt = db.prepare('UPDATE chats SET share_path = ? WHERE id = ?')
  updateStmt.run(sharePath, chat.id)

  return { ...chat, sharePath }
}

// Function to save or update a chat
export async function saveChat(chat: Chat) {
  const session = await auth()

  if (session?.user) {
    const validatedMessages = validateMessages(chat.messages)
    const insertOrUpdateStmt = db.prepare(`
      INSERT INTO chats (id, user_id, title, messages, share_path, created_at, topic, mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        title = excluded.title,
        messages = excluded.messages,
        share_path = excluded.share_path,
        created_at = excluded.created_at,
        topic = excluded.topic,
        mode = excluded.mode
    `)

    insertOrUpdateStmt.run(
      chat.id,
      chat.userId,
      chat.title, // Make sure to pass the title
      JSON.stringify(validatedMessages),
      chat.topic,
      chat.mode
    )
  } else {
    return
  }
}

// Function to refresh the page or history
export async function refreshHistory(path: string) {
  redirect(path)
}

// Function to check for missing environment keys
export async function getMissingKeys() {
  const keysRequired = ['OPENAI_API_KEY']

  return keysRequired
    .map(key => {
      if (process.env[key]) return ''
      if (typeof window !== 'undefined' && sessionStorage.getItem(key)) {
        return ''
      }
      return key
    })
    .filter(key => key !== '')
}
