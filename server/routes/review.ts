import { Hono } from 'hono'
import { getDB } from '../db'
import { authMiddleware, getAuth } from '../middleware/auth'

const review = new Hono()

review.use('*', authMiddleware)

const DEFAULT_REVIEW = {
  lastReviewDate: null,
  currentStep: 0,
  completedSteps: [false, false, false, false, false, false, false],
}

// Get review progress
review.get('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const db = getDB()

    let reviewData = await db.collection('review').findOne({ userId })

    if (!reviewData) {
      // Create default review for user
      await db.collection('review').insertOne({
        userId,
        ...DEFAULT_REVIEW,
      })
      reviewData = { userId, ...DEFAULT_REVIEW }
    }

    return c.json({
      review: {
        lastReviewDate: reviewData.lastReviewDate,
        currentStep: reviewData.currentStep,
        completedSteps: reviewData.completedSteps,
      },
    })
  } catch (error) {
    console.error('Get review error:', error)
    return c.json({ error: 'Failed to get review progress' }, 500)
  }
})

// Update review progress
review.put('/', async (c) => {
  try {
    const { userId } = getAuth(c)
    const updates = await c.req.json()

    const db = getDB()
    const result = await db
      .collection('review')
      .findOneAndUpdate(
        { userId },
        { $set: updates },
        { upsert: true, returnDocument: 'after' },
      )

    return c.json({
      review: {
        lastReviewDate: result?.lastReviewDate ?? null,
        currentStep: result?.currentStep ?? 0,
        completedSteps: result?.completedSteps ?? DEFAULT_REVIEW.completedSteps,
      },
    })
  } catch (error) {
    console.error('Update review error:', error)
    return c.json({ error: 'Failed to update review progress' }, 500)
  }
})

// Start new review
review.post('/start', async (c) => {
  try {
    const { userId } = getAuth(c)
    const db = getDB()

    const newReview = {
      lastReviewDate: Date.now(),
      currentStep: 0,
      completedSteps: [false, false, false, false, false, false, false],
    }

    await db
      .collection('review')
      .updateOne({ userId }, { $set: newReview }, { upsert: true })

    return c.json({ review: newReview })
  } catch (error) {
    console.error('Start review error:', error)
    return c.json({ error: 'Failed to start review' }, 500)
  }
})

// Complete review step
review.post('/step/:step', async (c) => {
  try {
    const { userId } = getAuth(c)
    const step = parseInt(c.req.param('step'))

    if (isNaN(step) || step < 0 || step > 6) {
      return c.json({ error: 'Invalid step number' }, 400)
    }

    const db = getDB()
    const reviewData = await db.collection('review').findOne({ userId })

    if (!reviewData) {
      return c.json({ error: 'No active review found' }, 404)
    }

    const newCompletedSteps = [...reviewData.completedSteps]
    newCompletedSteps[step] = true

    await db.collection('review').updateOne(
      { userId },
      {
        $set: {
          currentStep: step + 1,
          completedSteps: newCompletedSteps,
        },
      },
    )

    return c.json({
      review: {
        lastReviewDate: reviewData.lastReviewDate,
        currentStep: step + 1,
        completedSteps: newCompletedSteps,
      },
    })
  } catch (error) {
    console.error('Complete step error:', error)
    return c.json({ error: 'Failed to complete review step' }, 500)
  }
})

export default review
