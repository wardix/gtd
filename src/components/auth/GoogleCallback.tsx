import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Loader2 } from 'lucide-react'

export function GoogleCallback() {
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const googleLogin = useAuthStore((state) => state.googleLogin)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const errorParam = urlParams.get('error')

      console.log('Google callback - code:', code ? 'present' : 'missing')
      console.log('Google callback - error:', errorParam)

      if (errorParam) {
        setError('Google authentication was cancelled')
        setIsProcessing(false)
        return
      }

      if (!code) {
        setError('No authorization code received')
        setIsProcessing(false)
        return
      }

      try {
        const redirectUri = `${window.location.origin}/auth/google/callback`
        console.log('Calling googleLogin with redirectUri:', redirectUri)
        await googleLogin(code, redirectUri)
        console.log('Google login successful, waiting for state to persist...')

        // Wait a bit for Zustand to persist the state
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Use replace to avoid back button issues
        window.location.replace('/')
      } catch (err) {
        console.error('Google login error:', err)
        setError(
          err instanceof Error ? err.message : 'Google authentication failed',
        )
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, []) // Remove googleLogin from deps to prevent re-runs

  // If authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && !error) {
      window.location.replace('/')
    }
  }, [isAuthenticated, error])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <a href="/" className="text-primary hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">
          {isProcessing ? 'Completing Google sign in...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  )
}
