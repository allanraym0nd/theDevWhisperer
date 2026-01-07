import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

//GET - fetch canvas
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: interviewId } = await context.params

  // Verify interview belongs to user
  const { data: interview } = await supabase
    .from('interviews')
    .select('id')
    .eq('id', interviewId)
    .eq('user_id', user.id)
    .single()

  if (!interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
  }

  const {data: snapshot, error} = await supabase
    .from('canvas-snapshot')
    .select('*')
    .eq('interview_id', interviewId)
    .order('created_at', {ascending: false})
    .limit(1)
    .single()

    if(error || !snapshot) {
        return NextResponse.json({error: 'No canvas found'}, {status: 404})
    }
 return NextResponse.json(snapshot)
}


// POST - Save canvas
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } 

  const {id: interviewId} = await context.params
  const { snapshot_data } = await request.json()

  // Verify interview belongs to user
  const { data: interview } = await supabase
    .from('interviews')
    .select('id')
    .eq('id', interviewId)
    .eq('user_id', user.id)
    .single()

  if (!interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
  }

  const {data: snapshot, error} = await supabase 
   .from('canvas_snapshot')
   .insert({
    interview_id: interviewId,
    snapshot_data
   })
   .select()
   .single()

    if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(snapshot)

}