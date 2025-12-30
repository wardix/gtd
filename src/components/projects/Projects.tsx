import { useState } from 'react';
import { useGTDStore } from '@/store/gtdStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { CONTEXTS, type ProjectStatus, type Context } from '@/types/gtd';
import { Plus, Trash2, Edit2, FolderKanban, CheckCircle2, PauseCircle, PlayCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; icon: typeof PlayCircle; color: string }> = {
    active: { label: 'Active', icon: PlayCircle, color: 'text-green-500' },
    'on-hold': { label: 'On Hold', icon: PauseCircle, color: 'text-yellow-500' },
    completed: { label: 'Completed', icon: CheckCircle2, color: 'text-blue-500' },
};

export function Projects() {
    const [newProjectOpen, setNewProjectOpen] = useState(false);
    const [editProjectId, setEditProjectId] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('active');

    const projects = useGTDStore((state) => state.projects);
    const actions = useGTDStore((state) => state.actions);
    const waitingFor = useGTDStore((state) => state.waitingFor);
    const addProject = useGTDStore((state) => state.addProject);
    const updateProject = useGTDStore((state) => state.updateProject);
    const deleteProject = useGTDStore((state) => state.deleteProject);
    const addAction = useGTDStore((state) => state.addAction);
    const toggleActionComplete = useGTDStore((state) => state.toggleActionComplete);
    const deleteAction = useGTDStore((state) => state.deleteAction);
    const addWaitingFor = useGTDStore((state) => state.addWaitingFor);
    const deleteWaitingFor = useGTDStore((state) => state.deleteWaitingFor);

    const [newActionContent, setNewActionContent] = useState<Record<string, string>>({});
    const [newActionContext, setNewActionContext] = useState<Record<string, Context>>({});
    const [newWaitingContent, setNewWaitingContent] = useState<Record<string, string>>({});
    const [newWaitingPerson, setNewWaitingPerson] = useState<Record<string, string>>({});

    const filteredProjects = statusFilter === 'all'
        ? projects
        : projects.filter((p) => p.status === statusFilter);

    const getProjectActions = (projectId: string) =>
        actions.filter((a) => a.projectId === projectId);

    const getProjectWaitingFor = (projectId: string) =>
        waitingFor.filter((w) => w.projectId === projectId);

    const handleAddProject = () => {
        if (projectName.trim()) {
            addProject(projectName.trim(), projectDescription.trim());
            setProjectName('');
            setProjectDescription('');
            setNewProjectOpen(false);
        }
    };

    const handleEditProject = () => {
        if (editProjectId && projectName.trim()) {
            updateProject(editProjectId, { name: projectName.trim(), description: projectDescription.trim() });
            setEditProjectId(null);
            setProjectName('');
            setProjectDescription('');
        }
    };

    const openEditDialog = (id: string) => {
        const project = projects.find((p) => p.id === id);
        if (project) {
            setProjectName(project.name);
            setProjectDescription(project.description);
            setEditProjectId(id);
        }
    };

    const handleAddAction = (projectId: string) => {
        const content = newActionContent[projectId]?.trim();
        if (content) {
            const context = newActionContext[projectId] || '@anywhere';
            addAction(content, context, projectId);
            setNewActionContent((prev) => ({ ...prev, [projectId]: '' }));
        }
    };

    const handleAddWaitingFor = (projectId: string) => {
        const content = newWaitingContent[projectId]?.trim();
        const person = newWaitingPerson[projectId]?.trim();
        if (content && person) {
            addWaitingFor(content, person, projectId);
            setNewWaitingContent((prev) => ({ ...prev, [projectId]: '' }));
            setNewWaitingPerson((prev) => ({ ...prev, [projectId]: '' }));
        }
    };

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">
                        Track outcomes that require multiple actions
                    </p>
                </div>
                <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="Project name"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                            />
                            <Textarea
                                placeholder="Description (optional)"
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setNewProjectOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddProject} disabled={!projectName.trim()}>
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'active', 'on-hold', 'completed'] as const).map((status) => (
                    <Button
                        key={status}
                        variant={statusFilter === status ? 'secondary' : 'ghost'}
                        size="sm"
                        className="text-foreground"
                        onClick={() => setStatusFilter(status)}
                    >
                        {status === 'all' ? 'All' : STATUS_CONFIG[status].label}
                        <Badge variant="outline" className="ml-2">
                            {status === 'all'
                                ? projects.length
                                : projects.filter((p) => p.status === status).length}
                        </Badge>
                    </Button>
                ))}
            </div>

            {/* Projects Grid */}
            <ScrollArea className="flex-1">
                {filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FolderKanban className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No projects</p>
                        <p className="text-sm">Create your first project to get started</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredProjects.map((project) => {
                            const projectActions = getProjectActions(project.id);
                            const completedActions = projectActions.filter((a) => a.completed).length;
                            const StatusIcon = STATUS_CONFIG[project.status].icon;

                            return (
                                <Card key={project.id} className="group hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-lg">{project.name}</CardTitle>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => openEditDialog(project.id)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => deleteProject(project.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                        {project.description && (
                                            <CardDescription>{project.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <StatusIcon className={`h-4 w-4 ${STATUS_CONFIG[project.status].color}`} />
                                                <span>{STATUS_CONFIG[project.status].label}</span>
                                            </div>
                                            <span className="text-muted-foreground">
                                                {completedActions}/{projectActions.length} actions
                                            </span>
                                        </div>
                                        <div className="flex gap-1 mt-3">
                                            {(['active', 'on-hold', 'completed'] as ProjectStatus[]).map((status) => (
                                                <Button
                                                    key={status}
                                                    size="sm"
                                                    variant={project.status === status ? 'secondary' : 'ghost'}
                                                    className="flex-1 text-xs"
                                                    onClick={() => updateProject(project.id, { status })}
                                                >
                                                    {STATUS_CONFIG[status].label}
                                                </Button>
                                            ))}
                                        </div>

                                        {/* Actions List */}
                                        {projectActions.length > 0 && (
                                            <div className="mt-4 pt-3 border-t space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">Actions:</p>
                                                {projectActions.slice(0, 5).map((action) => (
                                                    <div key={action.id} className="flex items-center gap-2 text-sm">
                                                        <Checkbox
                                                            checked={action.completed}
                                                            onCheckedChange={() => toggleActionComplete(action.id)}
                                                        />
                                                        <span className={action.completed ? 'line-through text-muted-foreground' : ''}>
                                                            {action.content}
                                                        </span>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100"
                                                            onClick={() => deleteAction(action.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {projectActions.length > 5 && (
                                                    <p className="text-xs text-muted-foreground">+{projectActions.length - 5} more</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Add New Action */}
                                        <div className="mt-4 pt-3 border-t">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add action..."
                                                    value={newActionContent[project.id] || ''}
                                                    onChange={(e) => setNewActionContent((prev) => ({ ...prev, [project.id]: e.target.value }))}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddAction(project.id)}
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <Select
                                                    value={newActionContext[project.id] || '@anywhere'}
                                                    onValueChange={(v) => setNewActionContext((prev) => ({ ...prev, [project.id]: v as Context }))}
                                                >
                                                    <SelectTrigger className="w-24 h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CONTEXTS.map((ctx) => (
                                                            <SelectItem key={ctx.value} value={ctx.value}>
                                                                {ctx.emoji}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8"
                                                    onClick={() => handleAddAction(project.id)}
                                                    disabled={!newActionContent[project.id]?.trim()}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Waiting For List */}
                                        {(() => {
                                            const projectWaiting = getProjectWaitingFor(project.id);
                                            return projectWaiting.length > 0 && (
                                                <div className="mt-3 pt-3 border-t space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> Waiting For:
                                                    </p>
                                                    {projectWaiting.slice(0, 3).map((item) => (
                                                        <div key={item.id} className="flex items-center gap-2 text-sm">
                                                            <span className="text-muted-foreground">⏳</span>
                                                            <span className="flex-1">{item.content}</span>
                                                            <span className="text-xs text-muted-foreground">({item.person})</span>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                                onClick={() => deleteWaitingFor(item.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {projectWaiting.length > 3 && (
                                                        <p className="text-xs text-muted-foreground">+{projectWaiting.length - 3} more</p>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Add Waiting For */}
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-xs font-medium text-muted-foreground mb-2">Add Waiting For:</p>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="What are you waiting for?"
                                                    value={newWaitingContent[project.id] || ''}
                                                    onChange={(e) => setNewWaitingContent((prev) => ({ ...prev, [project.id]: e.target.value }))}
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <Input
                                                    placeholder="Who?"
                                                    value={newWaitingPerson[project.id] || ''}
                                                    onChange={(e) => setNewWaitingPerson((prev) => ({ ...prev, [project.id]: e.target.value }))}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddWaitingFor(project.id)}
                                                    className="w-24 h-8 text-sm"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8"
                                                    onClick={() => handleAddWaitingFor(project.id)}
                                                    disabled={!newWaitingContent[project.id]?.trim() || !newWaitingPerson[project.id]?.trim()}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-3">
                                            Created {formatDistanceToNow(project.createdAt, { addSuffix: true })}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>

            {/* Edit Project Dialog */}
            <Dialog open={!!editProjectId} onOpenChange={(open) => !open && setEditProjectId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Project name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                        <Textarea
                            placeholder="Description (optional)"
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditProjectId(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditProject} disabled={!projectName.trim()}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
