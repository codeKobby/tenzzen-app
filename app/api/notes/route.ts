import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for creating a note
const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['course', 'personal', 'code']),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// Schema for updating a note
const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  category: z.enum(['course', 'personal', 'code']).optional(),
  tags: z.array(z.string()).optional(),
  starred: z.boolean().optional(),
})

// GET /api/notes - Get all notes for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user ID from session
    const userId = session.user.id
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const courseId = searchParams.get('courseId')
    const lessonId = searchParams.get('lessonId')
    const starred = searchParams.get('starred')
    const search = searchParams.get('search')
    
    // Build query
    let query = supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    // Apply filters if provided
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    if (lessonId) {
      query = query.eq('lesson_id', lessonId)
    }
    
    if (starred === 'true') {
      query = query.eq('starred', true)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }
    
    // Execute query
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }
    
    // Transform data to match frontend types
    const notes = data.map(note => ({
      id: note.id,
      userId: note.user_id,
      courseId: note.course_id,
      lessonId: note.lesson_id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags || [],
      starred: note.starred,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }))
    
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error in GET /api/notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user ID from session
    const userId = session.user.id
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = createNoteSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.format() }, { status: 400 })
    }
    
    const { title, content, category, courseId, lessonId, tags } = validationResult.data
    
    // Insert note into database
    const { data, error } = await supabase
      .from('user_notes')
      .insert({
        user_id: userId,
        title,
        content,
        category,
        course_id: courseId,
        lesson_id: lessonId,
        tags: tags || [],
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating note:', error)
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }
    
    // Transform data to match frontend types
    const note = {
      id: data.id,
      userId: data.user_id,
      courseId: data.course_id,
      lessonId: data.lesson_id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      starred: data.starred,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
    
    return NextResponse.json(note)
  } catch (error) {
    console.error('Error in POST /api/notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
