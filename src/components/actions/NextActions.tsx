import { useState } from 'react';
import { useGTDStore } from '@/store/gtdStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CONTEXTS, type Context } from '@/types/gtd';
import { Plus, Trash2, ListTodo, CalendarIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function NextActions() {
    const [newActionOpen, setNewActionOpen] = useState(false);
    const [actionContent, setActionContent] = useState('');
    const [actionContext, setActionContext] = useState<Context>('@anywhere');
    const [actionProjectId, setActionProjectId] = useState<string | null>(null);
    const [actionDueDate, setActionDueDate] = useState<Date | undefined>(undefined);
    const [showCompleted, setShowCompleted] = useState(false);
    const [activeContext, setActiveContext] = useState<Context | 'all'>('all');

    const actions = useGTDStore((state) => state.actions);
    const projects = useGTDStore((state) => state.projects);
    const addAction = useGTDStore((state) => state.addAction);
    const toggleActionComplete = useGTDStore((state) => state.toggleActionComplete);
    const deleteAction = useGTDStore((state) => state.deleteAction);

    const filteredActions = actions.filter((a) => {
        if (!showCompleted && a.completed) return false;
        if (activeContext !== 'all' && a.context !== activeContext) return false;
        return true;
    });

    const pendingCount = actions.filter((a) => !a.completed).length;

    const handleAddAction = () => {
        if (actionContent.trim()) {
            addAction(
                actionContent.trim(),
                actionContext,
                actionProjectId,
                actionDueDate ? actionDueDate.getTime() : null
            );
            setActionContent('');
            setActionContext('@anywhere');
            setActionProjectId(null);
            setActionDueDate(undefined);
            setNewActionOpen(false);
        }
    };

    const getContextInfo = (context: Context) => {
        return CONTEXTS.find((c) => c.value === context) || CONTEXTS[5];
    };

    const getProjectName = (projectId: string | null) => {
        if (!projectId) return null;
        return projects.find((p) => p.id === projectId)?.name;
    };

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Next Actions</h2>
                    <p className="text-muted-foreground">
                        {pendingCount} actions waiting to be done
                    </p>
                </div>
                <Dialog open={newActionOpen} onOpenChange={setNewActionOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Action
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add New Action</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="What needs to be done?"
                                value={actionContent}
                                onChange={(e) => setActionContent(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Select value={actionContext} onValueChange={(v) => setActionContext(v as Context)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Context" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CONTEXTS.map((ctx) => (
                                            <SelectItem key={ctx.value} value={ctx.value}>
                                                {ctx.emoji} {ctx.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={actionProjectId || 'none'}
                                    onValueChange={(v) => setActionProjectId(v === 'none' ? null : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Project (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Project</SelectItem>
                                        {projects.filter((p) => p.status === 'active').map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">Due Date (optional)</p>
                                <Calendar
                                    mode="single"
                                    selected={actionDueDate}
                                    onSelect={setActionDueDate}
                                    className="rounded-md border"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setNewActionOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddAction} disabled={!actionContent.trim()}>
                                Add Action
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Context Tabs */}
            <Tabs value={activeContext} onValueChange={(v) => setActiveContext(v as Context | 'all')}>
                <TabsList className="w-full justify-start overflow-auto">
                    <TabsTrigger value="all">
                        All
                        <Badge variant="outline" className="ml-1.5">
                            {actions.filter((a) => !a.completed).length}
                        </Badge>
                    </TabsTrigger>
                    {CONTEXTS.map((ctx) => {
                        const count = actions.filter((a) => !a.completed && a.context === ctx.value).length;
                        return (
                            <TabsTrigger key={ctx.value} value={ctx.value}>
                                {ctx.emoji} {ctx.label}
                                {count > 0 && <Badge variant="outline" className="ml-1.5">{count}</Badge>}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                <TabsContent value={activeContext} className="mt-4">
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    {activeContext === 'all' ? 'All Actions' : getContextInfo(activeContext as Context).label}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCompleted(!showCompleted)}
                                >
                                    {showCompleted ? 'Hide' : 'Show'} Completed
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[calc(100vh-380px)]">
                                {filteredActions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <ListTodo className="h-12 w-12 mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No actions</p>
                                        <p className="text-sm">Add your first action to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredActions.map((action) => {
                                            const ctxInfo = getContextInfo(action.context);
                                            const projectName = getProjectName(action.projectId);

                                            return (
                                                <div
                                                    key={action.id}
                                                    className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group ${action.completed ? 'opacity-60' : ''
                                                        }`}
                                                >
                                                    <Checkbox
                                                        checked={action.completed}
                                                        onCheckedChange={() => toggleActionComplete(action.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-medium ${action.completed ? 'line-through' : ''}`}>
                                                            {action.content}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                                            <Badge variant="outline" className="text-xs">
                                                                {ctxInfo.emoji} {ctxInfo.label}
                                                            </Badge>
                                                            {projectName && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {projectName}
                                                                </Badge>
                                                            )}
                                                            {action.dueDate && (
                                                                <Badge
                                                                    variant={action.dueDate < Date.now() ? 'destructive' : 'outline'}
                                                                    className="text-xs"
                                                                >
                                                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                                                    {format(action.dueDate, 'MMM d')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {formatDistanceToNow(action.createdAt, { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                                        onClick={() => deleteAction(action.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
