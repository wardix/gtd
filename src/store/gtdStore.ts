import { create } from 'zustand';
import { api } from '@/lib/api';
import type {
    InboxItem,
    Project,
    Action,
    WaitingFor,
    SomedayMaybe,
    ReviewProgress,
    Context,
    SomedayCategory,
} from '@/types/gtd';

interface GTDState {
    // Data
    inbox: InboxItem[];
    projects: Project[];
    actions: Action[];
    waitingFor: WaitingFor[];
    somedayMaybe: SomedayMaybe[];
    review: ReviewProgress;

    // Loading states
    isLoading: boolean;
    isInitialized: boolean;

    // Initialize - fetch all data from API
    initializeData: () => Promise<void>;

    // Inbox actions
    addToInbox: (content: string) => Promise<void>;
    processInboxItem: (id: string) => Promise<void>;
    deleteInboxItem: (id: string) => Promise<void>;

    // Project actions
    addProject: (name: string, description?: string) => Promise<string>;
    updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;

    // Action actions
    addAction: (content: string, context: Context, projectId?: string | null, dueDate?: number | null) => Promise<void>;
    updateAction: (id: string, updates: Partial<Omit<Action, 'id' | 'createdAt'>>) => Promise<void>;
    toggleActionComplete: (id: string) => Promise<void>;
    deleteAction: (id: string) => Promise<void>;

    // Waiting For actions
    addWaitingFor: (content: string, person: string, projectId?: string | null, expectedDate?: number | null) => Promise<void>;
    updateWaitingFor: (id: string, updates: Partial<Omit<WaitingFor, 'id' | 'createdAt'>>) => Promise<void>;
    toggleWaitingForComplete: (id: string) => Promise<void>;
    deleteWaitingFor: (id: string) => Promise<void>;

    // Someday/Maybe actions
    addSomedayMaybe: (content: string, category: SomedayCategory) => Promise<void>;
    updateSomedayMaybe: (id: string, updates: Partial<Omit<SomedayMaybe, 'id' | 'createdAt'>>) => Promise<void>;
    deleteSomedayMaybe: (id: string) => Promise<void>;
    moveSomedayToAction: (id: string, context: Context, projectId?: string | null) => Promise<void>;
    moveSomedayToWaitingFor: (id: string, person: string, expectedDate?: number | null) => Promise<void>;

    // Review actions
    startReview: () => Promise<void>;
    completeReviewStep: (step: number) => Promise<void>;
    resetReview: () => Promise<void>;
}

const initialReview: ReviewProgress = {
    lastReviewDate: null,
    currentStep: 0,
    completedSteps: [false, false, false, false, false, false, false],
};

export const useGTDStore = create<GTDState>()((set, get) => ({
    // Initial state
    inbox: [],
    projects: [],
    actions: [],
    waitingFor: [],
    somedayMaybe: [],
    review: initialReview,
    isLoading: false,
    isInitialized: false,

    // Initialize - fetch all data from API
    initializeData: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });
        try {
            const [inboxRes, projectsRes, actionsRes, waitingForRes, somedayRes, reviewRes] = await Promise.all([
                api.getInbox(),
                api.getProjects(),
                api.getActions(),
                api.getWaitingFor(),
                api.getSomedayMaybe(),
                api.getReview(),
            ]);

            set({
                inbox: inboxRes.items,
                projects: projectsRes.items,
                actions: actionsRes.items,
                waitingFor: waitingForRes.items,
                somedayMaybe: somedayRes.items,
                review: reviewRes.review || initialReview,
                isInitialized: true,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to initialize GTD data:', error);
            set({ isLoading: false });
        }
    },

    // Inbox actions
    addToInbox: async (content) => {
        try {
            const { item } = await api.addInboxItem(content);
            set((state) => ({
                inbox: [...state.inbox, item],
            }));
        } catch (error) {
            console.error('Failed to add inbox item:', error);
            throw error;
        }
    },

    processInboxItem: async (id) => {
        try {
            await api.updateInboxItem(id, { processed: true });
            set((state) => ({
                inbox: state.inbox.map((item) =>
                    item.id === id ? { ...item, processed: true } : item
                ),
            }));
        } catch (error) {
            console.error('Failed to process inbox item:', error);
            throw error;
        }
    },

    deleteInboxItem: async (id) => {
        try {
            await api.deleteInboxItem(id);
            set((state) => ({
                inbox: state.inbox.filter((item) => item.id !== id),
            }));
        } catch (error) {
            console.error('Failed to delete inbox item:', error);
            throw error;
        }
    },

    // Project actions
    addProject: async (name, description = '') => {
        try {
            const { item } = await api.addProject(name, description);
            set((state) => ({
                projects: [...state.projects, item],
            }));
            return item.id;
        } catch (error) {
            console.error('Failed to add project:', error);
            throw error;
        }
    },

    updateProject: async (id, updates) => {
        try {
            await api.updateProject(id, updates);
            set((state) => ({
                projects: state.projects.map((project) =>
                    project.id === id ? { ...project, ...updates } : project
                ),
            }));
        } catch (error) {
            console.error('Failed to update project:', error);
            throw error;
        }
    },

    deleteProject: async (id) => {
        try {
            await api.deleteProject(id);
            set((state) => ({
                projects: state.projects.filter((project) => project.id !== id),
                actions: state.actions.map((action) =>
                    action.projectId === id ? { ...action, projectId: null } : action
                ),
                waitingFor: state.waitingFor.map((item) =>
                    item.projectId === id ? { ...item, projectId: null } : item
                ),
            }));
        } catch (error) {
            console.error('Failed to delete project:', error);
            throw error;
        }
    },

    // Action actions
    addAction: async (content, context, projectId = null, dueDate = null) => {
        try {
            const { item } = await api.addAction(content, context, projectId, dueDate);
            set((state) => ({
                actions: [...state.actions, item],
            }));
        } catch (error) {
            console.error('Failed to add action:', error);
            throw error;
        }
    },

    updateAction: async (id, updates) => {
        try {
            await api.updateAction(id, updates);
            set((state) => ({
                actions: state.actions.map((action) =>
                    action.id === id ? { ...action, ...updates } : action
                ),
            }));
        } catch (error) {
            console.error('Failed to update action:', error);
            throw error;
        }
    },

    toggleActionComplete: async (id) => {
        const action = get().actions.find((a) => a.id === id);
        if (!action) return;

        try {
            await api.updateAction(id, { completed: !action.completed });
            set((state) => ({
                actions: state.actions.map((a) =>
                    a.id === id ? { ...a, completed: !a.completed } : a
                ),
            }));
        } catch (error) {
            console.error('Failed to toggle action:', error);
            throw error;
        }
    },

    deleteAction: async (id) => {
        try {
            await api.deleteAction(id);
            set((state) => ({
                actions: state.actions.filter((action) => action.id !== id),
            }));
        } catch (error) {
            console.error('Failed to delete action:', error);
            throw error;
        }
    },

    // Waiting For actions
    addWaitingFor: async (content, person, projectId = null, expectedDate = null) => {
        try {
            const { item } = await api.addWaitingFor(content, person, projectId, expectedDate);
            set((state) => ({
                waitingFor: [...state.waitingFor, item],
            }));
        } catch (error) {
            console.error('Failed to add waiting for:', error);
            throw error;
        }
    },

    updateWaitingFor: async (id, updates) => {
        try {
            await api.updateWaitingFor(id, updates);
            set((state) => ({
                waitingFor: state.waitingFor.map((item) =>
                    item.id === id ? { ...item, ...updates } : item
                ),
            }));
        } catch (error) {
            console.error('Failed to update waiting for:', error);
            throw error;
        }
    },

    deleteWaitingFor: async (id) => {
        try {
            await api.deleteWaitingFor(id);
            set((state) => ({
                waitingFor: state.waitingFor.filter((item) => item.id !== id),
            }));
        } catch (error) {
            console.error('Failed to delete waiting for:', error);
            throw error;
        }
    },

    toggleWaitingForComplete: async (id) => {
        const item = get().waitingFor.find((w) => w.id === id);
        if (!item) return;

        try {
            await api.updateWaitingFor(id, { completed: !item.completed });
            set((state) => ({
                waitingFor: state.waitingFor.map((w) =>
                    w.id === id ? { ...w, completed: !w.completed } : w
                ),
            }));
        } catch (error) {
            console.error('Failed to toggle waiting for:', error);
            throw error;
        }
    },

    // Someday/Maybe actions
    addSomedayMaybe: async (content, category) => {
        try {
            const { item } = await api.addSomedayMaybe(content, category);
            set((state) => ({
                somedayMaybe: [...state.somedayMaybe, item],
            }));
        } catch (error) {
            console.error('Failed to add someday/maybe:', error);
            throw error;
        }
    },

    updateSomedayMaybe: async (id, updates) => {
        try {
            await api.updateSomedayMaybe(id, updates);
            set((state) => ({
                somedayMaybe: state.somedayMaybe.map((item) =>
                    item.id === id ? { ...item, ...updates } : item
                ),
            }));
        } catch (error) {
            console.error('Failed to update someday/maybe:', error);
            throw error;
        }
    },

    deleteSomedayMaybe: async (id) => {
        try {
            await api.deleteSomedayMaybe(id);
            set((state) => ({
                somedayMaybe: state.somedayMaybe.filter((item) => item.id !== id),
            }));
        } catch (error) {
            console.error('Failed to delete someday/maybe:', error);
            throw error;
        }
    },

    moveSomedayToAction: async (id, context, projectId = null) => {
        const item = get().somedayMaybe.find((i) => i.id === id);
        if (!item) return;

        try {
            // Add as action via API
            const { item: newAction } = await api.addAction(item.content, context, projectId, null);
            // Delete from someday via API
            await api.deleteSomedayMaybe(id);

            set((state) => ({
                somedayMaybe: state.somedayMaybe.filter((i) => i.id !== id),
                actions: [...state.actions, newAction],
            }));
        } catch (error) {
            console.error('Failed to move someday to action:', error);
            throw error;
        }
    },

    moveSomedayToWaitingFor: async (id, person, expectedDate = null) => {
        const item = get().somedayMaybe.find((i) => i.id === id);
        if (!item) return;

        try {
            // Add as waiting for via API
            const { item: newWaitingFor } = await api.addWaitingFor(item.content, person, null, expectedDate);
            // Delete from someday via API
            await api.deleteSomedayMaybe(id);

            set((state) => ({
                somedayMaybe: state.somedayMaybe.filter((i) => i.id !== id),
                waitingFor: [...state.waitingFor, newWaitingFor],
            }));
        } catch (error) {
            console.error('Failed to move someday to waiting for:', error);
            throw error;
        }
    },

    // Review actions
    startReview: async () => {
        try {
            const { review } = await api.startReview();
            set({ review });
        } catch (error) {
            console.error('Failed to start review:', error);
            throw error;
        }
    },

    completeReviewStep: async (step) => {
        try {
            const { review } = await api.completeReviewStep(step);
            set({ review });
        } catch (error) {
            console.error('Failed to complete review step:', error);
            throw error;
        }
    },

    resetReview: async () => {
        try {
            await api.updateReview(initialReview);
            set({ review: initialReview });
        } catch (error) {
            console.error('Failed to reset review:', error);
            throw error;
        }
    },
}));
