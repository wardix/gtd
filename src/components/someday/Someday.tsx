import { useState } from 'react'
import { useGTDStore } from '@/store/gtdStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  SOMEDAY_CATEGORIES,
  CONTEXTS,
  type SomedayCategory,
  type Context,
  type SomedayMaybe as SomedayMaybeType,
} from '@/types/gtd'
import { Plus, Trash2, Lightbulb, ArrowRight, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function SomedayMaybe() {
  const [newItemOpen, setNewItemOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SomedayMaybeType | null>(
    null,
  )
  const [itemContent, setItemContent] = useState('')
  const [itemCategory, setItemCategory] = useState<SomedayCategory>('other')
  const [moveContext, setMoveContext] = useState<Context>('@anywhere')
  const [delegatePerson, setDelegatePerson] = useState('')
  const [delegateDate, setDelegateDate] = useState<Date | undefined>(undefined)
  const [activeCategory, setActiveCategory] = useState<SomedayCategory | 'all'>(
    'all',
  )

  const somedayMaybe = useGTDStore((state) => state.somedayMaybe)
  const addSomedayMaybe = useGTDStore((state) => state.addSomedayMaybe)
  const deleteSomedayMaybe = useGTDStore((state) => state.deleteSomedayMaybe)
  const moveSomedayToAction = useGTDStore((state) => state.moveSomedayToAction)
  const moveSomedayToWaitingFor = useGTDStore(
    (state) => state.moveSomedayToWaitingFor,
  )

  const filteredItems =
    activeCategory === 'all'
      ? somedayMaybe
      : somedayMaybe.filter((item) => item.category === activeCategory)

  const handleAddItem = () => {
    if (itemContent.trim()) {
      addSomedayMaybe(itemContent.trim(), itemCategory)
      setItemContent('')
      setItemCategory('other')
      setNewItemOpen(false)
    }
  }

  const openMoveDialog = (item: SomedayMaybeType) => {
    setSelectedItem(item)
    setMoveDialogOpen(true)
  }

  const openDelegateDialog = (item: SomedayMaybeType) => {
    setSelectedItem(item)
    setDelegatePerson('')
    setDelegateDate(undefined)
    setDelegateDialogOpen(true)
  }

  const handleMoveToAction = () => {
    if (selectedItem) {
      moveSomedayToAction(selectedItem.id, moveContext)
      setMoveDialogOpen(false)
      setSelectedItem(null)
    }
  }

  const handleDelegate = () => {
    if (selectedItem && delegatePerson.trim()) {
      moveSomedayToWaitingFor(
        selectedItem.id,
        delegatePerson.trim(),
        delegateDate ? delegateDate.getTime() : null,
      )
      setDelegateDialogOpen(false)
      setSelectedItem(null)
      setDelegatePerson('')
      setDelegateDate(undefined)
    }
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Someday</h2>
          <p className="text-muted-foreground">
            Ideas and possibilities for the future
          </p>
        </div>
        <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Idea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Someday Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="What's on your mind?"
                value={itemContent}
                onChange={(e) => setItemContent(e.target.value)}
              />
              <Select
                value={itemCategory}
                onValueChange={(v) => setItemCategory(v as SomedayCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {SOMEDAY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewItemOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={!itemContent.trim()}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={(v) => setActiveCategory(v as SomedayCategory | 'all')}
      >
        <TabsList>
          <TabsTrigger value="all">
            All
            <Badge variant="outline" className="ml-1.5">
              {somedayMaybe.length}
            </Badge>
          </TabsTrigger>
          {SOMEDAY_CATEGORIES.map((cat) => {
            const count = somedayMaybe.filter(
              (i) => i.category === cat.value,
            ).length
            return (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
                {count > 0 && (
                  <Badge variant="outline" className="ml-1.5">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ideas & Possibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-380px)]">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No ideas yet</p>
                    <p className="text-sm">Capture your future possibilities</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                      >
                        <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{item.content}</p>
                          <div className="flex gap-2 mt-1.5">
                            <Badge variant="secondary" className="text-xs">
                              {
                                SOMEDAY_CATEGORIES.find(
                                  (c) => c.value === item.category,
                                )?.label
                              }
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(item.createdAt, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openMoveDialog(item)}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDelegateDialog(item)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Delegate
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => deleteSomedayMaybe(item.id)}
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
        </TabsContent>
      </Tabs>

      {/* Move to Action Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Next Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a context for this action:
            </p>
            <Select
              value={moveContext}
              onValueChange={(v) => setMoveContext(v as Context)}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveToAction}>Move to Actions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delegate to Waiting For Dialog */}
      <Dialog open={delegateDialogOpen} onOpenChange={setDelegateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegate to Waiting For</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium">{selectedItem.content}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Who will handle this?
              </label>
              <Input
                placeholder="Person name..."
                value={delegatePerson}
                onChange={(e) => setDelegatePerson(e.target.value)}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">
                Expected Date (optional)
              </p>
              <Calendar
                mode="single"
                selected={delegateDate}
                onSelect={setDelegateDate}
                className="rounded-md border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDelegateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDelegate} disabled={!delegatePerson.trim()}>
              <Users className="h-4 w-4 mr-2" />
              Delegate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
