import { Hono } from 'hono'
import { getDB } from '../db'
import { authMiddleware, getAuth } from '../middleware/auth'
import { ObjectId } from 'mongodb'

const somedayMaybe = new Hono()

somedayMaybe.use('*', authMiddleware)

// Get all someday/maybe items
somedayMaybe.get('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const db = getDB()

    const items = await db
      .collection('somedayMaybe')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    return c.json({
      items: items.map((item) => ({
        id: item._id.toString(),
        content: item.content,
        category: item.category,
        createdAt: item.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get somedayMaybe error:', error)
    return c.json({ error: 'Failed to get someday/maybe items' }, 500)
  }
})

// Add someday/maybe item
somedayMaybe.post('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const { content, category = 'other' } = await c.req.json()

    if (!content) {
      return c.json({ error: 'Content is required' }, 400)
    }

    const db = getDB()
    const result = await db.collection('somedayMaybe').insertOne({
      userId,
      content,
      category,
      createdAt: Date.now(),
    })

    return c.json(
      {
        item: {
          id: result.insertedId.toString(),
          content,
          category,
          createdAt: Date.now(),
        },
      },
      201,
    )
  } catch (error) {
    console.error('Add somedayMaybe error:', error)
    return c.json({ error: 'Failed to add someday/maybe item' }, 500)
  }
})

// Update someday/maybe item
somedayMaybe.patch('/:id', async (c) => {
  try {
    const { userId } = getAuth(c)
    const id = c.req.param('id')
    const updates = await c.req.json()

    const db = getDB()
    const result = await db
      .collection('somedayMaybe')
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
        category: result.category,
        createdAt: result.createdAt,
      },
    })
  } catch (error) {
    console.error('Update somedayMaybe error:', error)
    return c.json({ error: 'Failed to update someday/maybe item' }, 500)
  }
})

// Delete someday/maybe item
somedayMaybe.delete('/:id', async (c) => {
  try {
    const { userId } = getAuth(c)
    const id = c.req.param('id')

    const db = getDB()
    const result = await db.collection('somedayMaybe').deleteOne({
      _id: new ObjectId(id),
      userId,
    })

    if (result.deletedCount === 0) {
      return c.json({ error: 'Item not found' }, 404)
    }

    return c.json({ message: 'Item deleted' })
  } catch (error) {
    console.error('Delete somedayMaybe error:', error)
    return c.json({ error: 'Failed to delete someday/maybe item' }, 500)
  }
})

export default somedayMaybe
