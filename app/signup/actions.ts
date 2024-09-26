'use server'

import { signIn } from '@/auth'
import { ResultCode, getStringFromBuffer } from '@/lib/utils'
import { z } from 'zod'
import { getUser } from '../login/actions'
import { AuthError } from 'next-auth'
import Database from 'better-sqlite3'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

// Initialize SQLite database
const db = new Database('./local.db', { verbose: console.log })

// Define User interface
interface User {
  id: string
  email: string
  password: string
  salt: string
  is_active: number
  activation_token?: string
}

// Define the Result type
interface Result {
  type: 'success' | 'error'
  resultCode: ResultCode
}

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Ignore expired or invalid certificates
  }
})

// Function to send activation email
async function sendActivationEmail(email: string, activationToken: string) {
  const activationLink = `${process.env.FRONTEND_URL}/activate?token=${activationToken}` // Ensure FRONTEND_URL is in your .env file
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Activate Your Account',
    html: `
      <p>Thank you for signing up! Please click the link below to activate your account:</p>
      <a href="${activationLink}">${activationLink}</a>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Activation email sent to:', email)
  } catch (error) {
    console.error('Error sending activation email:', error)
  }
}

// Function to activate user account
export async function activateUser(token: string): Promise<Result> {
  const stmt = db.prepare(
    'UPDATE users SET is_active = 1, activation_token = NULL WHERE activation_token = ?'
  )
  const result = stmt.run(token)

  if (result.changes > 0) {
    return {
      type: 'success',
      resultCode: ResultCode.UserActivated
    }
  }

  return {
    type: 'error',
    resultCode: ResultCode.InvalidActivationToken
  }
}

// Create user in the database with an activation token
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
  const activationToken = crypto.randomBytes(32).toString('hex') // Generate an activation token

  const stmt = db.prepare(`
    INSERT INTO users (id, email, password, salt, is_active, activation_token)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  try {
    stmt.run(userId, email, hashedPassword, salt, 0, activationToken) // User is inactive initially
    await sendActivationEmail(email, activationToken) // Send activation email
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
      console.log('User created successfully. Activation email sent.')
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
