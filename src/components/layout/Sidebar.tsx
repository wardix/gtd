import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { useGTDStore } from '@/store/gtdStore'
import { useAuthStore } from '@/store/authStore'
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
} from 'lucide-react'

export type View =
    | 'inbox'
    | 'projects'
    | 'next-actions'
    | 'waiting-for'
    | 'someday-maybe'
    | 'calendar'
    | 'review'

interface SidebarProps {
    currentView: View
    onViewChange: (view: View) => void
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    const inbox = useGTDStore((state) => state.inbox)
    const projects = useGTDStore((state) => state.projects)
    const actions = useGTDStore((state) => state.actions)
    const waitingFor = useGTDStore((state) => state.waitingFor)
    const somedayMaybe = useGTDStore((state) => state.somedayMaybe)

    const unprocessedInbox = inbox.filter((item) => !item.processed).length
    const activeProjects = projects.filter((p) => p.status === 'active').length
    const pendingActions = actions.filter((a) => !a.completed).length

    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)

    const menuItems = [
        {
            id: 'inbox' as View,
            label: 'Inbox',
            icon: Inbox,
            count: unprocessedInbox,
        },
        {
            id: 'projects' as View,
            label: 'Projects',
            icon: FolderKanban,
            count: activeProjects,
        },
        {
            id: 'next-actions' as View,
            label: 'Next Actions',
            icon: ListTodo,
            count: pendingActions,
        },
        {
            id: 'waiting-for' as View,
            label: 'Waiting For',
            icon: Clock,
            count: waitingFor.filter((w) => !w.completed).length,
        },
        {
            id: 'someday-maybe' as View,
            label: 'Someday',
            icon: Lightbulb,
            count: somedayMaybe.length,
        },
        { id: 'calendar' as View, label: 'Calendar', icon: CalendarDays },
        { id: 'review' as View, label: 'Weekly Review', icon: RefreshCw },
    ]

    const handleViewChange = (view: View) => {
        onViewChange(view)
        setMobileOpen(false) // Close mobile menu on navigation
    }

    // Navigation content - reused in both desktop and mobile
    const NavigationContent = ({ showLabels = true }: { showLabels?: boolean }) => (
        <>
            <nav className="space-y-1">
                {menuItems.map((item) => (
                    <Button
                        key={item.id}
                        variant={currentView === item.id ? 'secondary' : 'ghost'}
                        className={cn(
                            'w-full justify-start gap-3 transition-all text-foreground',
                            !showLabels && 'justify-center px-2',
                        )}
                        onClick={() => handleViewChange(item.id)}
                    >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {showLabels && (
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
        </>
    )

    // User/Logout section - reused in both desktop and mobile
    const UserSection = ({ showLabels = true }: { showLabels?: boolean }) => (
        <>
            {user && (
                <div className={cn('flex items-center gap-2', !showLabels && 'flex-col')}>
                    {showLabels && (
                        <span className="text-xs text-muted-foreground truncate flex-1">
                            {user.email}
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size={showLabels ? 'sm' : 'icon'}
                        className={cn(
                            'text-muted-foreground',
                            showLabels && 'w-full',
                        )}
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4" />
                        {showLabels && <span className="ml-2">Logout</span>}
                    </Button>
                </div>
            )}
        </>
    )

    return (
        <>
            {/* Mobile Header Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 border-b border-border/40 bg-card/50 backdrop-blur-xl">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 bg-card/50 backdrop-blur-xl border-r border-border/40">
                        <SheetHeader className="p-4 border-b border-border/40">
                            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                GTD Flow
                            </SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="flex-1 px-2 py-4 h-[calc(100vh-140px)]">
                            <NavigationContent showLabels={true} />
                        </ScrollArea>
                        <Separator />
                        <div className="p-4">
                            <UserSection showLabels={true} />
                        </div>
                    </SheetContent>
                </Sheet>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    GTD Flow
                </h1>
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Desktop Sidebar */}
            <div
                className={cn(
                    'hidden md:flex flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl transition-all duration-300',
                    collapsed ? 'w-16' : 'w-64',
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
                    <NavigationContent showLabels={!collapsed} />
                </ScrollArea>

                <Separator />

                {/* Footer Actions */}
                <div
                    className={cn(
                        'p-2 space-y-1',
                        collapsed && 'flex flex-col items-center',
                    )}
                >
                    <UserSection showLabels={!collapsed} />
                </div>
            </div>
        </>
    )
}
