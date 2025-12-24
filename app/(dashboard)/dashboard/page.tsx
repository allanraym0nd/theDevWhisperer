import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { InterviewTypeCard } from '@/components/dashboard/interview-type-card'
import { BarChart3, Clock, TrendingUp, Flame } from 'lucide-react'

const interviewTypes = [
  {
    title: 'System Design',
    description: 'Design scalable systems like Twitter, Netflix, or URL shorteners',
    icon: '📊',
    type: 'system_design',
  },
  {
    title: 'Behavioral',
    description: 'Practice answering "Tell me about a time when..." questions',
    icon: '💬',
    type: 'behavioral',
  },
  {
    title: 'Coding',
    description: 'Solve algorithms while explaining your thought process',
    icon: '💻',
    type: 'coding',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch user's interviews
  const { data: interviews } = await supabase
    .from('interviews')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
  
  // Calculate stats
  const totalInterviews = interviews?.length || 0
  const completedInterviews = interviews?.filter(i => i.status === 'completed') || []
  
  // Calculate total duration
  const totalDuration = completedInterviews.reduce((acc, curr) => {
    return acc + (curr.duration_seconds || 0)
  }, 0)
  
  const totalHours = Math.floor(totalDuration / 3600)
  const totalMinutes = Math.floor((totalDuration % 3600) / 60)
  
  // Get feedback scores
  const interviewIds = completedInterviews.map(i => i.id)
  const { data: feedbacks } = await supabase
    .from('feedback')
    .select('overall_score, created_at')
    .in('interview_id', interviewIds)
    .order('created_at', { ascending: false })
  
  // Calculate average score
  const scores = feedbacks?.map(f => f.overall_score).filter(s => s != null) || []
  const averageScore = scores.length > 0 
    ? (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1)
    : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let currentStreak = 0
  const sortedInterviews = [...completedInterviews].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  
  for (let i = 0; i < sortedInterviews.length; i++) {
    const interviewDate = new Date(sortedInterviews[i].created_at)
    interviewDate.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.floor((today.getTime() - interviewDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === currentStreak) {
      currentStreak++
    } else if (daysDiff > currentStreak) {
      break
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress and start new interviews
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Interviews Completed"
          value={totalInterviews}
          icon={<BarChart3 className="h-8 w-8" />}
        />
        <StatCard
          label="Average Score"
          value={averageScore || '—'}
          icon={<TrendingUp className="h-8 w-8" />}
        />
        <StatCard
          label="Total Practice Time"
          value={totalInterviews > 0 ? `${totalHours}h ${totalMinutes}m` : '—'}
          icon={<Clock className="h-8 w-8" />}
        />
        <StatCard
          label="Day Streak"
          value={currentStreak > 0 ? `${currentStreak} 🔥` : '—'}
          icon={<Flame className="h-8 w-8" />}
        />
      </div>

      {/* Interview Types */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Start a New Interview
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {interviewTypes.map((type) => (
            <InterviewTypeCard
              key={type.type}
              title={type.title}
              description={type.description}
              icon={type.icon}
              type={type.type}
            />
          ))}
        </div>
      </div>
    </div>
  )
}