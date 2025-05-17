"use client"

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlock from '@tiptap/extension-code-block'
import Code from '@tiptap/extension-code'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code as CodeIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Palette,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  autoFocus?: boolean
  minHeight?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  className,
  autoFocus = false,
  minHeight = '200px',
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showLinkMenu, setShowLinkMenu] = useState(false)
  const [showImageMenu, setShowImageMenu] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#000000')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-md max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'rounded-md bg-muted p-4 font-mono text-sm',
        },
      }),
      Code.configure({
        HTMLAttributes: {
          class: 'rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm',
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
    ],
    content,
    editable,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  const setLink = useCallback(() => {
    if (!editor) return
    
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // Add https:// if not present and not empty
    const url = linkUrl.trim()
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: `https://${url}` }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    
    setShowLinkMenu(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (!editor) return
    
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
    }
    
    setShowImageMenu(false)
    setImageUrl('')
  }, [editor, imageUrl])

  const setColor = useCallback(() => {
    if (!editor) return
    
    editor.chain().focus().setColor(selectedColor).run()
  }, [editor, selectedColor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn('border rounded-md', className)}>
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive('bold') ? 'bg-muted' : '')}
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive('italic') ? 'bg-muted' : '')}
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(editor.isActive('underline') ? 'bg-muted' : '')}
            type="button"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(editor.isActive('code') ? 'bg-muted' : '')}
            type="button"
          >
            <CodeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn(editor.isActive('highlight') ? 'bg-muted' : '')}
            type="button"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(editor.isActive('heading', { level: 1 }) ? 'bg-muted' : '')}
            type="button"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(editor.isActive('heading', { level: 2 }) ? 'bg-muted' : '')}
            type="button"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(editor.isActive('heading', { level: 3 }) ? 'bg-muted' : '')}
            type="button"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive('bulletList') ? 'bg-muted' : '')}
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive('orderedList') ? 'bg-muted' : '')}
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn(editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : '')}
            type="button"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn(editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : '')}
            type="button"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn(editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : '')}
            type="button"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Popover open={showLinkMenu} onOpenChange={setShowLinkMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(editor.isActive('link') ? 'bg-muted' : '')}
                type="button"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="flex flex-col gap-2">
                <Label htmlFor="link-url">Link URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="link-url"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setLink()}
                  />
                  <Button onClick={setLink} type="button">Add</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover open={showImageMenu} onOpenChange={setShowImageMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="flex flex-col gap-2">
                <Label htmlFor="image-url">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image-url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addImage()}
                  />
                  <Button onClick={addImage} type="button">Add</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <div className="flex flex-col gap-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-10 h-10 p-1"
                  />
                  <Button onClick={setColor} type="button">Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              type="button"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              type="button"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <EditorContent 
        editor={editor} 
        className={cn(
          'prose dark:prose-invert max-w-none p-4 focus:outline-none',
          'prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
          'min-h-[200px]'
        )}
        style={{ minHeight }}
      />
    </div>
  )
}
