import { useGTDStore } from '@/store/gtdStore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { REVIEW_STEPS } from '@/types/gtd'
import { RefreshCw, CheckCircle2, Play, RotateCcw } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

export function Review() {
  const review = useGTDStore((state) => state.review)
  const inbox = useGTDStore((state) => state.inbox)
  const projects = useGTDStore((state) => state.projects)
  const actions = useGTDStore((state) => state.actions)
  const waitingFor = useGTDStore((state) => state.waitingFor)
  const somedayMaybe = useGTDStore((state) => state.somedayMaybe)
  const startReview = useGTDStore((state) => state.startReview)
  const completeReviewStep = useGTDStore((state) => state.completeReviewStep)
  const resetReview = useGTDStore((state) => state.resetReview)

  const completedSteps = review.completedSteps.filter(Boolean).length
  const progress = (completedSteps / REVIEW_STEPS.length) * 100
  const isComplete = completedSteps === REVIEW_STEPS.length

  const stats = {
    inbox: inbox.filter((i) => !i.processed).length,
    activeProjects: projects.filter((p) => p.status === 'active').length,
    pendingActions: actions.filter((a) => !a.completed).length,
    completedActions: actions.filter((a) => a.completed).length,
    waitingFor: waitingFor.length,
    somedayMaybe: somedayMaybe.length,
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Weekly Review</h2>
          <p className="text-muted-foreground">
            Get clear, current, and creative
          </p>
        </div>
        {review.lastReviewDate && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Last review</p>
            <p className="font-medium">
              {formatDistanceToNow(review.lastReviewDate, { addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.inbox}</p>
          <p className="text-xs text-muted-foreground">Inbox Items</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.activeProjects}</p>
          <p className="text-xs text-muted-foreground">Active Projects</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.pendingActions}</p>
          <p className="text-xs text-muted-foreground">Pending Actions</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.completedActions}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.waitingFor}</p>
          <p className="text-xs text-muted-foreground">Waiting For</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.somedayMaybe}</p>
          <p className="text-xs text-muted-foreground">Someday/Maybe</p>
        </Card>
      </div>

      {/* Review Progress */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Review Checklist
              </CardTitle>
              <CardDescription>
                {isComplete
                  ? 'All steps completed! Great job!'
                  : `${completedSteps} of ${REVIEW_STEPS.length} steps completed`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!review.lastReviewDate || isComplete ? (
                <Button onClick={startReview}>
                  <Play className="h-4 w-4 mr-2" />
                  {isComplete ? 'Start New Review' : 'Start Review'}
                </Button>
              ) : (
                <Button variant="outline" onClick={resetReview}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-500px)]">
            {isComplete ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-xl font-bold">Review Complete!</p>
                <p className="text-muted-foreground mt-2">
                  Completed on{' '}
                  {review.lastReviewDate &&
                    format(review.lastReviewDate, 'MMMM d, yyyy')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {REVIEW_STEPS.map((step, index) => {
                  const isCompleted = review.completedSteps[index]
                  const isCurrent = index === review.currentStep

                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                        isCurrent
                          ? 'border-primary bg-primary/5'
                          : isCompleted
                            ? 'bg-muted/50'
                            : ''
                      }`}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() =>
                          !isCompleted && completeReviewStep(index)
                        }
                        disabled={
                          !review.lastReviewDate || index > review.currentStep
                        }
                      />
                      <div className="flex-1">
                        <p
                          className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                        >
                          Step {index + 1}
                        </p>
                        <p
                          className={`text-sm ${isCompleted ? 'text-muted-foreground' : ''}`}
                        >
                          {step}
                        </p>
                      </div>
                      {isCurrent && !isCompleted && <Badge>Current</Badge>}
                      {isCompleted && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
