import { useState } from 'react'
import { useGTDStore } from '@/store/gtdStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CONTEXTS,
  SOMEDAY_CATEGORIES,
  type Context,
  type SomedayCategory,
} from '@/types/gtd'
import {
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  Lightbulb,
  ListTodo,
  Users,
  FolderKanban,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function Inbox() {
  const [newItem, setNewItem] = useState('')
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [processStep, setProcessStep] = useState<
    'actionable' | 'two-minute' | 'organize'
  >('actionable')
  const [selectedContext, setSelectedContext] = useState<Context>('@anywhere')
  const [selectedCategory, setSelectedCategory] =
    useState<SomedayCategory>('other')
  const [delegatePerson, setDelegatePerson] = useState('')

  const inbox = useGTDStore((state) => state.inbox)
  const addToInbox = useGTDStore((state) => state.addToInbox)
  const deleteInboxItem = useGTDStore((state) => state.deleteInboxItem)
  const processInboxItem = useGTDStore((state) => state.processInboxItem)
  const addAction = useGTDStore((state) => state.addAction)
  const addSomedayMaybe = useGTDStore((state) => state.addSomedayMaybe)
  const addWaitingFor = useGTDStore((state) => state.addWaitingFor)
  const addProject = useGTDStore((state) => state.addProject)

  const unprocessedItems = inbox.filter((item) => !item.processed)
  const selectedItem = inbox.find((item) => item.id === selectedItemId)

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItem.trim()) {
      addToInbox(newItem.trim())
      setNewItem('')
    }
  }

  const openProcessDialog = (id: string) => {
    setSelectedItemId(id)
    setProcessStep('actionable')
    setProcessDialogOpen(true)
  }

  const handleNotActionable = (action: 'delete' | 'someday') => {
    if (!selectedItemId || !selectedItem) return

    if (action === 'delete') {
      deleteInboxItem(selectedItemId)
    } else {
      addSomedayMaybe(selectedItem.content, selectedCategory)
      processInboxItem(selectedItemId)
      deleteInboxItem(selectedItemId)
    }
    setProcessDialogOpen(false)
  }

  const handleTwoMinute = (canDoNow: boolean) => {
    if (canDoNow) {
      // Mark as done (just delete from inbox)
      if (selectedItemId) {
        deleteInboxItem(selectedItemId)
      }
      setProcessDialogOpen(false)
    } else {
      setProcessStep('organize')
    }
  }

  const handleOrganize = (type: 'action' | 'delegate') => {
    if (!selectedItemId || !selectedItem) return

    if (type === 'action') {
      addAction(selectedItem.content, selectedContext)
    } else {
      addWaitingFor(selectedItem.content, delegatePerson, null)
    }
    processInboxItem(selectedItemId)
    deleteInboxItem(selectedItemId)
    setProcessDialogOpen(false)
    setDelegatePerson('')
  }

  const handleCreateProject = () => {
    if (!selectedItemId || !selectedItem) return
    addProject(selectedItem.content)
    processInboxItem(selectedItemId)
    deleteInboxItem(selectedItemId)
    setProcessDialogOpen(false)
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
        <p className="text-muted-foreground">
          Capture everything on your mind, then process it
        </p>
      </div>

      {/* Quick Capture */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAddItem} className="flex gap-2">
            <Input
              placeholder="What's on your mind? Press Enter to capture..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!newItem.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Capture
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Inbox Items */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Unprocessed Items</span>
            <Badge variant="secondary">{unprocessedItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-[calc(100vh-380px)]">
            {unprocessedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Inbox Zero!</p>
                <p className="text-sm">All items have been processed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unprocessedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(item.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openProcessDialog(item.id)}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Process
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteInboxItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Process: {selectedItem?.content}</DialogTitle>
            <DialogDescription>
              Let's clarify what this item means and what to do with it
            </DialogDescription>
          </DialogHeader>

          {processStep === 'actionable' && (
            <div className="space-y-4">
              <p className="font-medium">Is this actionable?</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => setProcessStep('two-minute')}
                >
                  <ListTodo className="h-8 w-8" />
                  <span>Yes, it's actionable</span>
                </Button>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full h-10"
                    onClick={() => handleNotActionable('delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Trash it
                  </Button>
                  <div className="flex gap-2">
                    <Select
                      value={selectedCategory}
                      onValueChange={(v) =>
                        setSelectedCategory(v as SomedayCategory)
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOMEDAY_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => handleNotActionable('someday')}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Someday
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {processStep === 'two-minute' && (
            <div className="space-y-4">
              <p className="font-medium">
                Can you do it in less than 2 minutes?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-24 flex-col gap-2"
                  onClick={() => handleTwoMinute(true)}
                >
                  <Clock className="h-8 w-8" />
                  <span>Yes! Do it now</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleTwoMinute(false)}
                >
                  <ArrowRight className="h-8 w-8" />
                  <span>No, organize it</span>
                </Button>
              </div>
            </div>
          )}

          {processStep === 'organize' && (
            <div className="space-y-4">
              <p className="font-medium">How do you want to handle this?</p>
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <Select
                    value={selectedContext}
                    onValueChange={(v) => setSelectedContext(v as Context)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTEXTS.map((ctx) => (
                        <SelectItem key={ctx.value} value={ctx.value}>
                          {ctx.emoji} {ctx.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleOrganize('action')}>
                    <ListTodo className="h-4 w-4 mr-2" />
                    Add to Next Actions
                  </Button>
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Who are you waiting for?"
                    value={delegatePerson}
                    onChange={(e) => setDelegatePerson(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleOrganize('delegate')}
                    disabled={!delegatePerson.trim()}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Delegate
                  </Button>
                </div>
                <div className="pt-2 border-t">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleCreateProject}
                  >
                    <FolderKanban className="h-4 w-4 mr-2" />
                    Create as Project (multiple steps needed)
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setProcessDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
