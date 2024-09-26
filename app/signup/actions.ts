'use server'

import { signIn } from '@/auth'
import { ResultCode, getStringFromBuffer } from '@/lib/utils'
import { z } from 'zod'
import { getUser } from '../login/actions'
import { AuthError } from 'next-auth'
import Database from 'better-sqlite3'

// Initialize SQLite database
const db = new Database('./local.db', { verbose: console.log })

// Define User interface
interface User {
  id: string
  email: string
  password: string
  salt: string
}

// Define the Result type
interface Result {
  type: 'success' | 'error'
  resultCode: ResultCode
}

// Create user in the database
export async function createUser(
  email: string,
  hashedPassword: string,
  salt: string
): Promise<Result> {
  const existingUser = await getUser(email)

  if (existingUser) {
    return {
      type: 'error',
      resultCode: ResultCode.UserAlreadyExists
    }
  }

  const userId = crypto.randomUUID()
  const stmt = db.prepare(`
    INSERT INTO users (id, email, password, salt)
    VALUES (?, ?, ?, ?)
  `)

  try {
    stmt.run(userId, email, hashedPassword, salt)
    return {
      type: 'success',
      resultCode: ResultCode.UserCreated
    }
  } catch (error) {
    console.error('Error inserting user into the database:', error)
    return {
      type: 'error',
      resultCode: ResultCode.UnknownError
    }
  }
}

// Sign-up function
export async function signup(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate credentials using Zod
  const parsedCredentials = z
    .object({
      email: z.string().email(),
      password: z.string().min(6)
    })
    .safeParse({
      email,
      password
    })

  if (!parsedCredentials.success) {
    return {
      type: 'error',
      resultCode: ResultCode.InvalidCredentials
    }
  }

  const salt = crypto.randomUUID()
  const encoder = new TextEncoder()
  const saltedPassword = encoder.encode(password + salt)

  try {
    // Hash the password
    const hashedPasswordBuffer = await crypto.subtle.digest(
      'SHA-256',
      saltedPassword
    )
    const hashedPassword = getStringFromBuffer(hashedPasswordBuffer)

    // Attempt to create the user
    const result = await createUser(email, hashedPassword, salt)

    if (result.resultCode === ResultCode.UserCreated) {
      await signIn('credentials', {
        email,
        password,
        redirect: false
      })
    }

    return result
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            type: 'error',
            resultCode: ResultCode.InvalidCredentials
          }
        default:
          return {
            type: 'error',
            resultCode: ResultCode.UnknownError
          }
      }
    }
    console.error('Unexpected error during signup:', error)
    return {
      type: 'error',
      resultCode: ResultCode.UnknownError
    }
  }
}
