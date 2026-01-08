'use client'

import { useState, useEffect } from 'react'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

interface CanvasWrapperProps {
  interviewId: string
  onSave?: (snapshot: any) => void
}

export default function CanvasWrapper({ interviewId, onSave }: CanvasWrapperProps) {
  const [editor, setEditor] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Auto-save canvas every 30 seconds
  useEffect(() => {
    if (!editor) return

    const interval = setInterval(() => {
      const snapshot = editor.store.getSnapshot()
      if (onSave) {
        onSave(snapshot)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [editor, onSave])

  // Load saved canvas
  useEffect(() => {
    if (!editor) return

    async function loadCanvas() {
      try {
        const response = await fetch(`/api/canvas/${interviewId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.snapshot_data) {
            editor.store.loadSnapshot(data.snapshot_data)
          }
        }
      } catch (error) {
        // No saved canvas
      }
    }

    loadCanvas()
  }, [editor, interviewId])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border border-border rounded-lg">
        <p className="text-gray-600">Loading canvas...</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Tldraw
        onMount={(editor) => setEditor(editor)}
        hideUi={false}
      />
    </div>
  )
}