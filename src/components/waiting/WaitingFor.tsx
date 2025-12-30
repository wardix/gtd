import { useState } from 'react'
import { useGTDStore } from '@/store/gtdStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Plus,
  Trash2,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  CONTEXTS,
  type Context,
  type WaitingFor as WaitingForType,
} from '@/types/gtd'

export function WaitingFor() {
  const [newItemOpen, setNewItemOpen] = useState(false)
  const [itemContent, setItemContent] = useState('')
  const [itemPerson, setItemPerson] = useState('')
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined)
  const [showCompleted, setShowCompleted] = useState(false)

  // Convert to Action dialog state
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [convertItem, setConvertItem] = useState<WaitingForType | null>(null)
  const [convertContext, setConvertContext] = useState<Context>('@anywhere')
  const [convertContent, setConvertContent] = useState('')

  // Follow-up dialog state
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
  const [followUpPerson, setFollowUpPerson] = useState('')
  const [followUpContent, setFollowUpContent] = useState('')
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined)

  const waitingFor = useGTDStore((state) => state.waitingFor)
  const addWaitingFor = useGTDStore((state) => state.addWaitingFor)
  const deleteWaitingFor = useGTDStore((state) => state.deleteWaitingFor)
  const toggleWaitingForComplete = useGTDStore(
    (state) => state.toggleWaitingForComplete,
  )
  const addAction = useGTDStore((state) => state.addAction)

  const activeItems = waitingFor.filter((item) => !item.completed)
  const completedItems = waitingFor.filter((item) => item.completed)

  const handleAddItem = () => {
    if (itemContent.trim() && itemPerson.trim()) {
      addWaitingFor(
        itemContent.trim(),
        itemPerson.trim(),
        null, // projectId
        expectedDate ? expectedDate.getTime() : null,
      )
      setItemContent('')
      setItemPerson('')
      setExpectedDate(undefined)
      setNewItemOpen(false)
    }
  }

  const handleOpenConvertDialog = (item: WaitingForType) => {
    setConvertItem(item)
    setConvertContent(`Follow up: ${item.content}`)
    setConvertContext('@anywhere')
    setConvertDialogOpen(true)
  }

  const handleConvertToAction = () => {
    if (convertItem && convertContent.trim()) {
      addAction(
        convertContent.trim(),
        convertContext,
        convertItem.projectId,
        null,
      )
      deleteWaitingFor(convertItem.id)
      setConvertDialogOpen(false)
      setConvertItem(null)
      setConvertContent('')
    }
  }

  const handleOpenFollowUpDialog = (item: WaitingForType) => {
    setFollowUpPerson(item.person)
    setFollowUpContent('')
    setFollowUpDate(undefined)
    setFollowUpDialogOpen(true)
  }

  const handleCreateFollowUp = () => {
    if (followUpContent.trim() && followUpPerson.trim()) {
      addWaitingFor(
        followUpContent.trim(),
        followUpPerson.trim(),
        null,
        followUpDate ? followUpDate.getTime() : null,
      )
      setFollowUpDialogOpen(false)
      setFollowUpContent('')
      setFollowUpPerson('')
      setFollowUpDate(undefined)
    }
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Waiting For</h2>
          <p className="text-muted-foreground">
            Track delegated tasks and things you're waiting on
          </p>
        </div>
        <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Waiting For Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="What are you waiting for?"
                value={itemContent}
                onChange={(e) => setItemContent(e.target.value)}
              />
              <Input
                placeholder="Who are you waiting on?"
                value={itemPerson}
                onChange={(e) => setItemPerson(e.target.value)}
              />
              <div>
                <p className="text-sm font-medium mb-2">
                  Expected Date (optional)
                </p>
                <Calendar
                  mode="single"
                  selected={expectedDate}
                  onSelect={setExpectedDate}
                  className="rounded-md border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewItemOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={!itemContent.trim() || !itemPerson.trim()}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Convert to Action Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Action content
              </label>
              <Input
                placeholder="What's the next action?"
                value={convertContent}
                onChange={(e) => setConvertContent(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Context</label>
              <Select
                value={convertContext}
                onValueChange={(v) => setConvertContext(v as Context)}
              >
                <SelectTrigger>
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
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConvertDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToAction}
              disabled={!convertContent.trim()}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Create Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Follow-up Dialog */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Person</label>
              <Input
                value={followUpPerson}
                onChange={(e) => setFollowUpPerson(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                What are you waiting for?
              </label>
              <Input
                placeholder="New item to wait for..."
                value={followUpContent}
                onChange={(e) => setFollowUpContent(e.target.value)}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">
                Expected Date (optional)
              </p>
              <Calendar
                mode="single"
                selected={followUpDate}
                onSelect={setFollowUpDate}
                className="rounded-md border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFollowUpDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFollowUp}
              disabled={!followUpContent.trim() || !followUpPerson.trim()}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Create Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waiting For Items */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Items</span>
            <Badge variant="secondary">{activeItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-300px)]">
            {activeItems.length === 0 && completedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nothing pending</p>
                <p className="text-sm">All clear! No items waiting</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Items */}
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => toggleWaitingForComplete(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.content}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {item.person}
                        </Badge>
                        {item.expectedDate && (
                          <Badge
                            variant={
                              item.expectedDate < Date.now()
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            Expected: {format(item.expectedDate, 'MMM d, yyyy')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Added{' '}
                        {formatDistanceToNow(item.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => deleteWaitingFor(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                {/* Completed Items Section */}
                {completedItems.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                    >
                      {showCompleted ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Completed ({completedItems.length})</span>
                    </button>
                    {showCompleted && (
                      <div className="space-y-2">
                        {completedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 group"
                          >
                            <Checkbox
                              checked={true}
                              onCheckedChange={() =>
                                toggleWaitingForComplete(item.id)
                              }
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <p className="font-medium line-through text-muted-foreground">
                                {item.content}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {item.person}
                                </Badge>
                              </div>
                              {/* Action buttons for completed items */}
                              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenConvertDialog(item)}
                                >
                                  <ArrowRight className="h-3 w-3 mr-1" />
                                  Convert to Action
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenFollowUpDialog(item)}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Follow-up
                                </Button>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                              onClick={() => deleteWaitingFor(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
