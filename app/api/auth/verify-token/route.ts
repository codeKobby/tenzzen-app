import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { token, type } = await request.json()
    
    if (!token || !type) {
      return NextResponse.json(
        { error: 'Token and type are required' },
        { status: 400 }
      )
    }
    
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'email',
      token_hash: token,
    })

    if (error) {
      console.error('Verification error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Email verified successfully',
      user: data.user,
      session: data.session
    }, { status: 200 })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
