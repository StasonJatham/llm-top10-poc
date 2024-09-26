'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import Database from 'better-sqlite3'
import { ResultCode, getStringFromBuffer } from '@/lib/utils'

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

// Function to retrieve user data from SQLite
export async function getUser(email: string): Promise<User | null> {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
  const user = stmt.get(email) as User | undefined

  return user || null
}

// Authentication function
export async function authenticate(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
  try {
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

    // Retrieve user from the database
    const user = await getUser(email)
    if (!user) {
      return {
        type: 'error',
        resultCode: ResultCode.InvalidCredentials
      }
    }

    // Verify the password
    const encoder = new TextEncoder()
    const saltedPassword = encoder.encode(password + user.salt)
    const hashedPasswordBuffer = await crypto.subtle.digest(
      'SHA-256',
      saltedPassword
    )
    const hashedPassword = getStringFromBuffer(hashedPasswordBuffer)

    if (hashedPassword !== user.password) {
      return {
        type: 'error',
        resultCode: ResultCode.InvalidCredentials
      }
    }

    // Sign in the user
    await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    return {
      type: 'success',
      resultCode: ResultCode.UserLoggedIn
    }
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

    console.error('Unexpected error during authentication:', error)
    return {
      type: 'error',
      resultCode: ResultCode.UnknownError
    }
  }
}
