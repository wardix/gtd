import { Hono } from 'hono';
import { getDB } from '../db';
import { authMiddleware, getAuth } from '../middleware/auth';
import { ObjectId } from 'mongodb';

const actions = new Hono();

actions.use('*', authMiddleware);

// Get all actions
actions.get('/', async (c) => {
    try {
        const { userId } = getAuth(c);
        const db = getDB();

        const items = await db.collection('actions')
            .find({ userId })
            .sort({ createdAt: -1 })
            .toArray();

        return c.json({
            items: items.map((item) => ({
                id: item._id.toString(),
                content: item.content,
                projectId: item.projectId,
                context: item.context,
                dueDate: item.dueDate,
                completed: item.completed,
                createdAt: item.createdAt,
            })),
        });
    } catch (error) {
        console.error('Get actions error:', error);
        return c.json({ error: 'Failed to get actions' }, 500);
    }
});

// Add action
actions.post('/', async (c) => {
    try {
        const { userId } = getAuth(c);
        const { content, context = '@anywhere', projectId = null, dueDate = null } = await c.req.json();

        if (!content) {
            return c.json({ error: 'Content is required' }, 400);
        }

        const db = getDB();
        const result = await db.collection('actions').insertOne({
            userId,
            content,
            context,
            projectId,
            dueDate,
            completed: false,
            createdAt: Date.now(),
        });

        return c.json({
            item: {
                id: result.insertedId.toString(),
                content,
                context,
                projectId,
                dueDate,
                completed: false,
                createdAt: Date.now(),
            },
        }, 201);
    } catch (error) {
        console.error('Add action error:', error);
        return c.json({ error: 'Failed to add action' }, 500);
    }
});

// Update action
actions.patch('/:id', async (c) => {
    try {
        const { userId } = getAuth(c);
        const id = c.req.param('id');
        const updates = await c.req.json();

        const db = getDB();
        const result = await db.collection('actions').findOneAndUpdate(
            { _id: new ObjectId(id), userId },
            { $set: updates },
            { returnDocument: 'after' }
        );

        if (!result) {
            return c.json({ error: 'Action not found' }, 404);
        }

        return c.json({
            item: {
                id: result._id.toString(),
                content: result.content,
                projectId: result.projectId,
                context: result.context,
                dueDate: result.dueDate,
                completed: result.completed,
                createdAt: result.createdAt,
            },
        });
    } catch (error) {
        console.error('Update action error:', error);
        return c.json({ error: 'Failed to update action' }, 500);
    }
});

// Delete action
actions.delete('/:id', async (c) => {
    try {
        const { userId } = getAuth(c);
        const id = c.req.param('id');

        const db = getDB();
        const result = await db.collection('actions').deleteOne({
            _id: new ObjectId(id),
            userId,
        });

        if (result.deletedCount === 0) {
            return c.json({ error: 'Action not found' }, 404);
        }

        return c.json({ message: 'Action deleted' });
    } catch (error) {
        console.error('Delete action error:', error);
        return c.json({ error: 'Failed to delete action' }, 500);
    }
});

export default actions;
