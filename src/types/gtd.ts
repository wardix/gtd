// GTD Data Types
export type Context =
  | '@home'
  | '@office'
  | '@phone'
  | '@computer'
  | '@errands'
  | '@anywhere'
export type ProjectStatus = 'active' | 'completed' | 'on-hold'
export type SomedayCategory =
  | 'personal'
  | 'work'
  | 'hobby'
  | 'learning'
  | 'other'

export interface InboxItem {
  id: string
  content: string
  createdAt: number
  processed: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  createdAt: number
}

export interface Action {
  id: string
  content: string
  projectId: string | null
  context: Context
  dueDate: number | null
  completed: boolean
  createdAt: number
}

export interface WaitingFor {
  id: string
  content: string
  person: string
  projectId: string | null
  expectedDate: number | null
  completed: boolean
  createdAt: number
}

export interface SomedayMaybe {
  id: string
  content: string
  category: SomedayCategory
  createdAt: number
}

export interface ReviewProgress {
  lastReviewDate: number | null
  currentStep: number
  completedSteps: boolean[]
}

export const CONTEXTS: { value: Context; label: string; emoji: string }[] = [
  { value: '@home', label: 'Home', emoji: '🏠' },
  { value: '@office', label: 'Office', emoji: '🏢' },
  { value: '@phone', label: 'Phone', emoji: '📱' },
  { value: '@computer', label: 'Computer', emoji: '💻' },
  { value: '@errands', label: 'Errands', emoji: '🚗' },
  { value: '@anywhere', label: 'Anywhere', emoji: '🌍' },
]

export const SOMEDAY_CATEGORIES: { value: SomedayCategory; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' },
]

export const REVIEW_STEPS = [
  'Clear your inbox - Process all items',
  'Review your calendar - Check upcoming events',
  'Review Next Actions - Are they still relevant?',
  'Review Projects - Update status and add new actions',
  'Review Waiting For - Follow up if needed',
  'Review Someday/Maybe - Move items to active if ready',
  'Capture new ideas - Anything on your mind?',
]
