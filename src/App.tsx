import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useGTDStore } from '@/store/gtdStore'
import { Sidebar, type View } from '@/components/layout/Sidebar'
import { Inbox } from '@/components/inbox/Inbox'
import { Projects } from '@/components/projects/Projects'
import { NextActions } from '@/components/actions/NextActions'
import { WaitingFor } from '@/components/waiting/WaitingFor'
import { SomedayMaybe } from '@/components/someday/Someday'
import { CalendarView } from '@/components/calendar/CalendarView'
import { Review } from '@/components/review/Review'
import { AuthPage } from '@/components/auth/AuthPage'
import { GoogleCallback } from '@/components/auth/GoogleCallback'
import { Toaster } from '@/components/ui/sonner'
import { Loader2 } from 'lucide-react'

function App() {
  const [currentView, setCurrentView] = useState<View>('inbox')
  const [isInitializing, setIsInitializing] = useState(true)

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const token = useAuthStore((state) => state.token)

  const initializeData = useGTDStore((state) => state.initializeData)
  const isGTDLoading = useGTDStore((state) => state.isLoading)
  const isGTDInitialized = useGTDStore((state) => state.isInitialized)

  // Check if we're on OAuth callback route - handle this FIRST before any auth checks
  const isGoogleCallback = window.location.pathname === '/auth/google/callback'

  // Auth initialization
  useEffect(() => {
    // Skip initialization if we're on the callback page
    if (isGoogleCallback) {
      setIsInitializing(false)
      return
    }

    const init = async () => {
      if (token) {
        await checkAuth()
      }
      setIsInitializing(false)
    }
    init()
  }, [checkAuth, token, isGoogleCallback])

  // GTD data initialization - only after authenticated
  useEffect(() => {
    if (isAuthenticated && !isGTDInitialized) {
      initializeData()
    }
  }, [isAuthenticated, isGTDInitialized, initializeData])

  // Handle Google OAuth callback FIRST - before any loading or auth checks
  if (isGoogleCallback) {
    return (
      <div className="dark">
        <GoogleCallback />
        <Toaster />
      </div>
    )
  }

  // Show loading while checking auth
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Show auth page if not authenticated - check this BEFORE GTD loading
  if (!isAuthenticated) {
    return (
      <div className="dark">
        <AuthPage />
        <Toaster />
      </div>
    )
  }

  // Show loading while fetching GTD data (only for authenticated users)
  if (isGTDLoading || !isGTDInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your GTD data...</p>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'inbox':
        return <Inbox />
      case 'projects':
        return <Projects />
      case 'next-actions':
        return <NextActions />
      case 'waiting-for':
        return <WaitingFor />
      case 'someday-maybe':
        return <SomedayMaybe />
      case 'calendar':
        return <CalendarView />
      case 'review':
        return <Review />
      default:
        return <Inbox />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background dark">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">{renderView()}</main>
      <Toaster />
    </div>
  )
}

export default App
