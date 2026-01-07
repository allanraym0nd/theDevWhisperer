'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useVoice } from '@/hooks/use-voice'
import { VoiceControls } from '@/components/interview/voice-controls'
import { TranscriptPanel } from '@/components/interview/transcript-panel'
import { AiAvatar } from '@/components/interview/ai-avatar'
import getSystemPrompt from '@/lib/groq/prompt'
import { InterviewType } from '@/config/interview-types'
import CanvasWrapper from '@/components/interview/canvas-wrapper'
import { Button } from '@/components/ui/button'


interface Message {
  role: 'ai' | 'user'
  content: string
  timestamp: string
}

interface Interview {
  id: string
  type: InterviewType
  topic: string
  status: string
  started_at: string
}

const MAX_DURATION = 45 * 60 

export default function InterviewPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string

  const [interview, setInterview] = useState<Interview | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [duration, setDuration] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    resetTranscript,
  } = useVoice()

  // Fetch interview details
  useEffect(() => {
    async function fetchInterview() {
      try {
        const response = await fetch(`/api/interviews/${interviewId}`)
        const data = await response.json()
        console.log('Fetched interview:', data)  
        console.log('Topic:', data.topic)
        setInterview(data)
      } catch (error) {
        console.error('Failed to fetch interview:', error)
        router.push('/dashboard')
      }
    }

    fetchInterview()
  }, [interviewId, router])

  // Start interview with AI greeting
  useEffect(() => {
    if (interview && !hasStarted) {
      setHasStarted(true)
      const greeting = getGreeting(interview.type, interview.topic)
      const aiMessage: Message = {
        role: 'ai',
        content: greeting,
        timestamp: new Date().toISOString(),
      }
      setMessages([aiMessage])
      speak(greeting)
      
      // Save greeting to database
      saveMessage(aiMessage)
    }
  }, [interview, hasStarted])

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => {
        if (prev >= MAX_DURATION) {
          handleEndInterview()
          return prev
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Process user's spoken response
  useEffect(() => {
    if (!isListening && transcript && !isProcessing) {
      handleUserResponse(transcript)
    }
  }, [isListening, transcript, isProcessing])

  const getGreeting = (type: InterviewType, topic: string) => {
    const greetings = {
      system_design: `Hello! I'm excited to work through this system design interview with you. Today we'll be designing ${topic}. Let's start by clarifying the requirements. What questions would you ask to understand the scope?`,
      behavioral: `Hi! Thanks for joining me today. I'd like to explore ${topic}. Take a moment to think about a specific situation, then walk me through it using the STAR method - Situation, Task, Action, and Result. Whenever you're ready, please begin.`,
      coding: `Hello! Let's work on ${topic} today. I'll present a problem, and I'd like you to talk through your approach, discuss the algorithm, and analyze complexity. Ready to start?`,
    }
    return greetings[type] || `Hello! Let's begin the interview on ${topic}.`
  }

  const handleUserResponse = async (userText: string) => {
    if (!interview || !userText.trim()) return

    setIsProcessing(true)

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    resetTranscript()

    // Save to database
    await saveMessage(userMessage)

    // Get AI response
    try {
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content,
      }))

      // Add system prompt at the beginning
      const systemPrompt = getSystemPrompt(interview.type, interview.topic)
      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ]

      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: fullMessages }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Add AI response
      const aiMessage: Message = {
        role: 'ai',
        content: data.message,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMessage])

      // Speak AI response
      speak(data.message)

      // Save to database
      await saveMessage(aiMessage)
    } catch (error) {
      console.error('Failed to get AI response:', error)
      const errorMessage: Message = {
        role: 'ai',
        content: "I apologize, I'm having trouble responding. Could you please repeat that?",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
      speak(errorMessage.content)
    } finally {
      setIsProcessing(false)
    }
  }

  const saveMessage = async (message: Message) => {
    try {
      await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: interviewId,
          role: message.role,
          content: message.content,
        }),
      })
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  const saveCanvas = async (canvasData: any) => {
    try { 
      await fetch(`/api/canvas/${interviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({snapshot_data: canvasData})
      })
      console.log('Canvas saved')
    }catch(error){
      console.error('Failed to save canvas:', error)
    }

  }

  const handleEndInterview = async () => {
    stopListening()
    stopSpeaking()

    try {
      // Update interview status
      await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          duration_seconds: duration,
          completed_at: new Date().toISOString()
        }),
      })

      
      router.push(`/interview/${interviewId}/feedback`)
    } catch (error) {
      console.error('Failed to end interview:', error)
    }
  }

  
if (!interview) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading interview...</p>
    </div>
  )
}

return (
  <div className="min-h-screen bg-background p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{interview.topic}</h1>
        <p className="text-muted-foreground capitalize">
          {interview?.type?.replace('_', ' ') || 'Loading'} Interview
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Canvas placeholder (future) */}
      <div className="lg:col-span-2 space-y-6">
      <div className="bg-white rounded-lg overflow-hidden border border-border">
          <CanvasWrapper 
            interviewId={interviewId}
            onSave={saveCanvas}
          />
        </div>


  {/* Voice Controls */}
  <VoiceControls
    isListening={isListening}
    isSpeaking={isSpeaking}
    transcript={transcript}
    duration={duration}
    maxDuration={MAX_DURATION}
    onStartListening={startListening}
    onStopListening={stopListening}
    onStopSpeaking={stopSpeaking}
    onEndInterview={handleEndInterview}
  />

  {/* End Interview Button */}
  <button
  onClick={handleEndInterview}
  style={{
    width: '100%',
    padding: '12px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
  }}
  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
>
  End Interview
</button>
</div>
      
        {/* Right: AI Avatar + Transcript */}
        <div className="space-y-6">
          <AiAvatar isSpeaking={isSpeaking} />
          <div className="h-[500px]">
            <TranscriptPanel messages={messages} />
          </div>
        </div>
      </div>
    </div>
  </div>
)
}