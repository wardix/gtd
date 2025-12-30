import { Hono } from 'hono'
import { getDB } from '../db'
import { authMiddleware, getAuth } from '../middleware/auth'
import { ObjectId } from 'mongodb'

const projects = new Hono()

projects.use('*', authMiddleware)

// Get all projects
projects.get('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const db = getDB()

    const items = await db
      .collection('projects')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    return c.json({
      items: items.map((item) => ({
        id: item._id.toString(),
        name: item.name,
        description: item.description,
        status: item.status,
        createdAt: item.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get projects error:', error)
    return c.json({ error: 'Failed to get projects' }, 500)
  }
})

// Add project
projects.post('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const { name, description = '' } = await c.req.json()

    if (!name) {
      return c.json({ error: 'Name is required' }, 400)
    }

    const db = getDB()
    const result = await db.collection('projects').insertOne({
      userId,
      name,
      description,
      status: 'active',
      createdAt: Date.now(),
    })

    return c.json(
      {
        item: {
          id: result.insertedId.toString(),
          name,
          description,
          status: 'active',
          createdAt: Date.now(),
        },
      },
      201,
    )
  } catch (error) {
    console.error('Add project error:', error)
    return c.json({ error: 'Failed to add project' }, 500)
  }
})

// Update project
projects.patch('/:id', async (c) => {
  try {
    const { userId } = getAuth(c)
    const id = c.req.param('id')
    const updates = await c.req.json()

    const db = getDB()
    const result = await db
      .collection('projects')
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId },
        { $set: updates },
        { returnDocument: 'after' },
      )

    if (!result) {
      return c.json({ error: 'Project not found' }, 404)
    }

    return c.json({
      item: {
        id: result._id.toString(),
        name: result.name,
        description: result.description,
        status: result.status,
        createdAt: result.createdAt,
      },
    })
  } catch (error) {
    console.error('Update project error:', error)
    return c.json({ error: 'Failed to update project' }, 500)
  }
})

// Delete project
projects.delete('/:id', async (c) => {
  try {
    const { userId } = getAuth(c)
    const id = c.req.param('id')

    const db = getDB()

    // Delete project
    const result = await db.collection('projects').deleteOne({
      _id: new ObjectId(id),
      userId,
    })

    if (result.deletedCount === 0) {
      return c.json({ error: 'Project not found' }, 404)
    }

    // Unlink actions and waitingFor from this project
    await db
      .collection('actions')
      .updateMany({ userId, projectId: id }, { $set: { projectId: null } })
    await db
      .collection('waitingFor')
      .updateMany({ userId, projectId: id }, { $set: { projectId: null } })

    return c.json({ message: 'Project deleted' })
  } catch (error) {
    console.error('Delete project error:', error)
    return c.json({ error: 'Failed to delete project' }, 500)
  }
})

export default projects
