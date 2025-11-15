import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-ssr'

// Schema for updating a note
const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  category: z.enum(['course', 'personal', 'code']).optional(),
  tags: z.array(z.string()).optional(),
  starred: z.boolean().optional(),
})

// GET /api/notes/[id] - Get a specific note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from session
    const userId = session.user.id

    // Get note ID from params
    const { id } = params

    // Fetch note from database
    const { data, error } = await supabase
      .from('user_notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      }
      console.error('Error fetching note:', error)
      return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
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
    console.error('Error in GET /api/notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/notes/[id] - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from session
    const userId = session.user.id

    // Get note ID from params
    const { id } = params

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateNoteSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.format() }, { status: 400 })
    }

    const { title, content, category, tags, starred } = validationResult.data

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (starred !== undefined) updateData.starred = starred

    // Update note in database
    const { data, error } = await supabase
      .from('user_notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating note:', error)
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
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
    console.error('Error in PUT /api/notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from session
    const userId = session.user.id

    // Get note ID from params
    const { id } = params

    // Delete note from database
    const { error } = await supabase
      .from('user_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting note:', error)
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
