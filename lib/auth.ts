import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import db from './db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// User type definition
export interface UserPayload {
  id: string
  email: string
  role: 'USER' | 'COACH' | 'ADMIN'
}

// Lazy validation - only when functions are called
function getJWTSecret() {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET environment variable not set or too short (min 32 chars)')
  }
  return new TextEncoder().encode(JWT_SECRET)
}

const AUTH_COOKIE_NAME = 'auth-token'
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

function generateId() {
  return crypto.randomUUID()
}

export async function signUp(email: string, password: string, name: string) {
  if (!email || !password || !name) {
    throw new Error('Missing required fields')
  }

  const hash = await bcrypt.hash(password, 10)
  const userId = generateId()

  try {
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, name)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email, email, hash, name)

    db.prepare(`
      INSERT INTO profiles (user_id)
      VALUES (?)
    `).run(userId)

    return { success: true, userId }
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return { error: 'Email already exists' }
    }
    throw error
  }
}

export async function signIn(email: string, password: string) {
  if (!email || !password) {
    throw new Error('Missing email or password')
  }

  const user = db.prepare(`
    SELECT id, username, email, name, role, password_hash FROM users
    WHERE email = ?
  `).get(email) as any

  if (!user) {
    return { error: 'Invalid credentials' }
  }

  const validPassword = await bcrypt.compare(password, user.password_hash)
  if (!validPassword) {
    return { error: 'Invalid credentials' }
  }

  const JWT_SECRET_ENCODED = getJWTSecret()

  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET_ENCODED)

  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
  })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

export async function signOut() {
  cookies().delete(AUTH_COOKIE_NAME)
  return { success: true }
}

export async function getCurrentUser(req?: NextRequest): Promise<UserPayload | null> {
  const token = req?.cookies.get(AUTH_COOKIE_NAME)?.value || cookies().get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const JWT_SECRET_ENCODED = getJWTSecret()
    const verified = await jwtVerify(token, JWT_SECRET_ENCODED)
    const payload = verified.payload as unknown as UserPayload
    return payload
  } catch (error) {
    return null
  }
}

export async function getSession(req?: NextRequest): Promise<UserPayload | null> {
  return getCurrentUser(req)
}
