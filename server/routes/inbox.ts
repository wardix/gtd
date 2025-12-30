import { Hono } from 'hono'
import { getDB } from '../db'
import { authMiddleware, getAuth } from '../middleware/auth'
import { ObjectId } from 'mongodb'

const inbox = new Hono()

// All routes require authentication
inbox.use('*', authMiddleware)

// Get all inbox items for user
inbox.get('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const db = getDB()

    const items = await db
      .collection('inbox')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    return c.json({
      items: items.map((item) => ({
        id: item._id.toString(),
        content: item.content,
        createdAt: item.createdAt,
        processed: item.processed,
      })),
    })
  } catch (error) {
    console.error('Get inbox error:', error)
    return c.json({ error: 'Failed to get inbox items' }, 500)
  }
})

// Add inbox item
inbox.post('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const { content } = await c.req.json()

    if (!content) {
      return c.json({ error: 'Content is required' }, 400)
    }

    const db = getDB()
    const result = await db.collection('inbox').insertOne({
      userId,
      content,
      createdAt: Date.now(),
      processed: false,
    })

    return c.json(
      {
        item: {
          id: result.insertedId.toString(),
          content,
          createdAt: Date.now(),
          processed: false,
        },
      },
      201,
    )
  } catch (error) {
    console.error('Add inbox error:', error)
    return c.json({ error: 'Failed to add inbox item' }, 500)
  }
})

// Update inbox item
inbox.patch('/:id', async (c) => {
  try {
    const { userId } = getAuth(c)
    const id = c.req.param('id')
    const updates = await c.req.json()

    const db = getDB()
    const result = await db
      .collection('inbox')
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
        createdAt: result.createdAt,
        processed: result.processed,
      },
    })
  } catch (error) {
    console.error('Update inbox error:', error)
    return c.json({ error: 'Failed to update inbox item' }, 500)
  }
})

// Delete inbox item
inbox.delete('/:id', async (c) => {
  try {
    const { userId } = getAuth(c)
    const id = c.req.param('id')

    const db = getDB()
    const result = await db.collection('inbox').deleteOne({
      _id: new ObjectId(id),
      userId,
    })

    if (result.deletedCount === 0) {
      return c.json({ error: 'Item not found' }, 404)
    }

    return c.json({ message: 'Item deleted' })
  } catch (error) {
    console.error('Delete inbox error:', error)
    return c.json({ error: 'Failed to delete inbox item' }, 500)
  }
})

export default inbox
