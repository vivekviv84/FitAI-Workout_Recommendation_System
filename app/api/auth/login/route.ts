import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { authLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - prevents brute force attacks
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown').split(',')[0]
    const rateLimitResult = authLimiter(ip)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts, try again later' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }

    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const result = await signIn(email, password)
    if ((result as any).error) {
      return NextResponse.json({ error: (result as any).error }, { status: 401 })
    }

    return NextResponse.json({ ok: true, user: (result as any).user })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
