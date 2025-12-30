import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGTDStore } from '@/store/gtdStore';
import { useAuthStore } from '@/store/authStore';
import {
    Inbox,
    FolderKanban,
    ListTodo,
    Clock,
    Lightbulb,
    CalendarDays,
    RefreshCw,
    Menu,
    LogOut,
} from 'lucide-react';

export type View = 'inbox' | 'projects' | 'next-actions' | 'waiting-for' | 'someday-maybe' | 'calendar' | 'review';

interface SidebarProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    const inbox = useGTDStore((state) => state.inbox);
    const projects = useGTDStore((state) => state.projects);
    const actions = useGTDStore((state) => state.actions);
    const waitingFor = useGTDStore((state) => state.waitingFor);
    const somedayMaybe = useGTDStore((state) => state.somedayMaybe);

    const unprocessedInbox = inbox.filter((item) => !item.processed).length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const pendingActions = actions.filter((a) => !a.completed).length;

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const menuItems = [
        { id: 'inbox' as View, label: 'Inbox', icon: Inbox, count: unprocessedInbox },
        { id: 'projects' as View, label: 'Projects', icon: FolderKanban, count: activeProjects },
        { id: 'next-actions' as View, label: 'Next Actions', icon: ListTodo, count: pendingActions },
        { id: 'waiting-for' as View, label: 'Waiting For', icon: Clock, count: waitingFor.filter((w) => !w.completed).length },
        { id: 'someday-maybe' as View, label: 'Someday/Maybe', icon: Lightbulb, count: somedayMaybe.length },
        { id: 'calendar' as View, label: 'Calendar', icon: CalendarDays },
        { id: 'review' as View, label: 'Weekly Review', icon: RefreshCw },
    ];

    return (
        <div
            className={cn(
                'flex flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4">
                {!collapsed && (
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        GTD Flow
                    </h1>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="shrink-0"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            <Separator />

            {/* Navigation */}
            <ScrollArea className="flex-1 px-2 py-4">
                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <Button
                            key={item.id}
                            variant={currentView === item.id ? 'secondary' : 'ghost'}
                            className={cn(
                                'w-full justify-start gap-3 transition-all text-foreground',
                                collapsed && 'justify-center px-2'
                            )}
                            onClick={() => onViewChange(item.id)}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.count !== undefined && item.count > 0 && (
                                        <Badge variant="secondary" className="ml-auto">
                                            {item.count}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </Button>
                    ))}
                </nav>
            </ScrollArea>

            <Separator />

            {/* Footer Actions */}
            <div className={cn('p-2 space-y-1', collapsed && 'flex flex-col items-center')}>
                {/* User Info & Logout */}
                {user && (
                    <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
                        {!collapsed && (
                            <span className="text-xs text-muted-foreground truncate flex-1">
                                {user.email}
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size={collapsed ? 'icon' : 'sm'}
                            className={cn('w-full text-muted-foreground', collapsed && 'w-10')}
                            onClick={logout}
                        >
                            <LogOut className="h-4 w-4" />
                            {!collapsed && <span className="ml-2">Logout</span>}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

