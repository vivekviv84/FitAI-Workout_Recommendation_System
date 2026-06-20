import { NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'
import { signupLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown').split(',')[0]
    const rateLimitResult = signupLimiter(ip)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts, try again later' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }

    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Password length validation
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const result = await signUp(email, password, name)
    if ((result as any).error) {
      return NextResponse.json({ error: (result as any).error }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: (result as any).userId })
  } catch (err: any) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
