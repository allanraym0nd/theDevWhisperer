'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CanvasWrapper from '@/components/interview/canvas-wrapper'

interface Message { 
    id: string
    role: string
    content: string
    timestamp: string
}

interface Interview { 
  id: string
  type: string
  topic: string
  created_at: string
  duration_seconds: number
}

export default function ReviewPage() {
    const router = useRouter()
    const params = useParams() 
    const interviewId = params.id as string

    const [interview, setInterview] = useState<Interview | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading,setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData(){

        try {
            // Fetch interview
        const interviewRes = await fetch(`/api/interviews/${interviewId}`)
        const interviewData = await interviewRes.json()
        setInterview(interviewData)

        // Fetch transcript
        const transcriptRes = await fetch(`/api/transcripts/${interviewId}`)
        const transcriptData = await transcriptRes.json()
        setMessages(transcriptData)

        }catch(error) {
            console.error('Failed to fetch data:', error)

        }finally {
            setIsLoading(false)
        }
        }

        fetchData()

    },[interviewId])

    const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading transcript...</p>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Interview not found</p>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">{interview.topic}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="capitalize">{interview.type.replace('_', ' ')}</span>
            <span>•</span>
            <span>{new Date(interview.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{formatDuration(interview.duration_seconds || 0)}</span>
          </div>
        </div>

        {/* Canvas Review */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Diagram</h2>
              <div className="h-96 rounded-lg">
                <CanvasWrapper 
                  interviewId={interviewId}
                  onSave={() => {}} // Read-only in review
                />
              </div>
            </CardContent>
          </Card>

        {/* Transcript */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Full Transcript</h2>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    message.role === 'ai'
                      ? 'bg-secondary/50 border-l-blue-500'
                      : 'bg-secondary/30 border-l-green-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        message.role === 'ai' ? 'text-blue-500' : 'text-green-500'
                      }`}
                    >
                      {message.role === 'ai' ? 'AI Interviewer' : 'You'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button onClick={() => router.push(`/interview/${interviewId}/feedback`)}>
            View Feedback
          </Button>
          <Button variant="outline" onClick={() => router.push('/history')}>
            Back to History
          </Button>
        </div>
      </div>
    </div>
  )


}