import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.log("AUTH ERROR TYPE:", authError.name);
    console.log("AUTH ERROR MESSAGE:", authError.message);
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type, topic } = await request.json()
  console.log('Creating interview in DB:', { type, topic, user_id: user.id })  // ← Add logging


  const { data: interview, error } = await supabase
    .from('interviews')
    .insert({
      user_id: user.id,
      type,
      topic,
      status: 'in_progress',
    })
    .select()
    .single()

  console.log('Supabase response:', { interview, error })

  if (error) {
    console.error('Database error:', error)  // ← Add logging
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  console.log('Returning interview:', interview)  // ← Add logging
  return NextResponse.json(interview)
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: interviews, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(interviews)
}