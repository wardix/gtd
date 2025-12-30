import { Hono } from 'hono'
import { getDB } from '../db'
import { authMiddleware, getAuth } from '../middleware/auth'
import { ObjectId } from 'mongodb'

const waitingFor = new Hono()

waitingFor.use('*', authMiddleware)

// Get all waiting for items
waitingFor.get('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const db = getDB()

    const items = await db
      .collection('waitingFor')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    return c.json({
      items: items.map((item) => ({
        id: item._id.toString(),
        content: item.content,
        person: item.person,
        projectId: item.projectId,
        expectedDate: item.expectedDate,
        completed: item.completed ?? false,
        createdAt: item.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get waitingFor error:', error)
    return c.json({ error: 'Failed to get waiting for items' }, 500)
  }
})

// Add waiting for item
waitingFor.post('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const {
      content,
      person,
      projectId = null,
      expectedDate = null,
    } = await c.req.json()

    if (!content || !person) {
      return c.json({ error: 'Content and person are required' }, 400)
    }

    const db = getDB()
    const result = await db.collection('waitingFor').insertOne({
      userId,
      content,
      person,
      projectId,
      expectedDate,
      completed: false,
      createdAt: Date.now(),
    })

    return c.json(
      {
        item: {
          id: result.insertedId.toString(),
          content,
          person,
          projectId,
          expectedDate,
          completed: false,
          createdAt: Date.now(),
        },
      },
      201,
    )
  } catch (error) {
    console.error('Add waitingFor error:', error)
    return c.json({ error: 'Failed to add waiting for item' }, 500)
  }
})

// Update waiting for item
waitingFor.patch('/:id', async (c) => {
  try {
    const { userId } = getAuth(c)
    const id = c.req.param('id')
    const updates = await c.req.json()

    const db = getDB()
    const result = await db
      .collection('waitingFor')
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId },
        { $set: updates },
        { returnDocument: 'after' },
      )

    if (!result) {
      return c.json({ error: 'Item not found' }, 404)
    }

    return c.json({
      item: {
        id: result._id.toString(),
        content: result.content,
        person: result.person,
        projectId: result.projectId,
        expectedDate: result.expectedDate,
        completed: result.completed ?? false,
        createdAt: result.createdAt,
      },
    })
  } catch (error) {
    console.error('Update waitingFor error:', error)
    return c.json({ error: 'Failed to update waiting for item' }, 500)
  }
})

// Delete waiting for item
waitingFor.delete('/:id', async (c) => {
  try {
    const { userId } = getAuth(c)
    const id = c.req.param('id')

    const db = getDB()
    const result = await db.collection('waitingFor').deleteOne({
      _id: new ObjectId(id),
      userId,
    })

    if (result.deletedCount === 0) {
      return c.json({ error: 'Item not found' }, 404)
    }

    return c.json({ message: 'Item deleted' })
  } catch (error) {
    console.error('Delete waitingFor error:', error)
    return c.json({ error: 'Failed to delete waiting for item' }, 500)
  }
})

export default waitingFor
