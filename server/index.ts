import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import inboxRoutes from './routes/inbox';
import projectsRoutes from './routes/projects';
import actionsRoutes from './routes/actions';
import waitingForRoutes from './routes/waitingFor';
import somedayMaybeRoutes from './routes/somedayMaybe';
import reviewRoutes from './routes/review';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'GTD API Server' }));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/inbox', inboxRoutes);
app.route('/api/projects', projectsRoutes);
app.route('/api/actions', actionsRoutes);
app.route('/api/waiting-for', waitingForRoutes);
app.route('/api/someday-maybe', somedayMaybeRoutes);
app.route('/api/review', reviewRoutes);

// Start server
const port = Number(process.env.PORT) || 3001;

const startServer = async () => {
    try {
        await connectDB();
        Bun.serve({
            port,
            fetch: app.fetch,
        });
        console.log(`🚀 Server running on http://localhost:${port}`);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
