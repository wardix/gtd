import { useState } from 'react';
import { useGTDStore } from '@/store/gtdStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CONTEXTS } from '@/types/gtd';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

export function CalendarView() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const actions = useGTDStore((state) => state.actions);
    const waitingFor = useGTDStore((state) => state.waitingFor);

    const actionsWithDueDate = actions.filter((a) => a.dueDate && !a.completed);
    const waitingWithDate = waitingFor.filter((w) => w.expectedDate);

    const selectedDateActions = selectedDate
        ? actionsWithDueDate.filter((a) => a.dueDate && isSameDay(a.dueDate, selectedDate))
        : [];

    const selectedDateWaiting = selectedDate
        ? waitingWithDate.filter((w) => w.expectedDate && isSameDay(w.expectedDate, selectedDate))
        : [];

    const getContextInfo = (context: string) => {
        return CONTEXTS.find((c) => c.value === context) || CONTEXTS[5];
    };

    // Get dates with items for highlighting
    const datesWithItems = new Set<string>();
    actionsWithDueDate.forEach((a) => {
        if (a.dueDate) datesWithItems.add(format(a.dueDate, 'yyyy-MM-dd'));
    });
    waitingWithDate.forEach((w) => {
        if (w.expectedDate) datesWithItems.add(format(w.expectedDate, 'yyyy-MM-dd'));
    });

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
                <p className="text-muted-foreground">
                    View your actions and deadlines
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 flex-1">
                {/* Calendar */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Date</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border"
                            modifiers={{
                                hasItems: (date) => datesWithItems.has(format(date, 'yyyy-MM-dd')),
                            }}
                            modifiersStyles={{
                                hasItems: {
                                    fontWeight: 'bold',
                                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                                    borderRadius: '50%',
                                },
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Selected Date Items */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" />
                            {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ScrollArea className="h-[400px]">
                            {selectedDateActions.length === 0 && selectedDateWaiting.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Nothing scheduled</p>
                                    <p className="text-sm">No items due on this date</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedDateActions.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                                Actions Due
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedDateActions.map((action) => {
                                                    const ctx = getContextInfo(action.context);
                                                    return (
                                                        <div
                                                            key={action.id}
                                                            className="p-3 rounded-lg border bg-card"
                                                        >
                                                            <p className="font-medium">{action.content}</p>
                                                            <Badge variant="outline" className="mt-2 text-xs">
                                                                {ctx.emoji} {ctx.label}
                                                            </Badge>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {selectedDateWaiting.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                                Expected Responses
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedDateWaiting.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="p-3 rounded-lg border bg-card"
                                                    >
                                                        <p className="font-medium">{item.content}</p>
                                                        <Badge variant="secondary" className="mt-2 text-xs">
                                                            From: {item.person}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Upcoming</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1 p-4 rounded-lg bg-primary/5 border">
                            <p className="text-2xl font-bold">{actionsWithDueDate.length}</p>
                            <p className="text-sm text-muted-foreground">Actions with due dates</p>
                        </div>
                        <div className="flex-1 p-4 rounded-lg bg-secondary/50 border">
                            <p className="text-2xl font-bold">{waitingWithDate.length}</p>
                            <p className="text-sm text-muted-foreground">Expected responses</p>
                        </div>
                        <div className="flex-1 p-4 rounded-lg bg-destructive/10 border">
                            <p className="text-2xl font-bold">
                                {actionsWithDueDate.filter((a) => a.dueDate && a.dueDate < Date.now()).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Overdue</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
