import { Hono } from 'hono';
import { getDB } from '../db';
import { generateToken, authMiddleware, getAuth } from '../middleware/auth';
import { ObjectId } from 'mongodb';

const auth = new Hono();

// Register with email/password
auth.post('/register', async (c) => {
    try {
        const { email, password, name } = await c.req.json();

        if (!email || !password || !name) {
            return c.json({ error: 'Email, password, and name are required' }, 400);
        }

        const db = getDB();
        const usersCollection = db.collection('users');

        // Check if user exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return c.json({ error: 'Email already registered' }, 400);
        }

        // Hash password
        const hashedPassword = await Bun.password.hash(password, {
            algorithm: 'bcrypt',
            cost: 10,
        });

        // Create user
        const result = await usersCollection.insertOne({
            email,
            password: hashedPassword,
            name,
            googleId: null,
            avatar: null,
            authProvider: 'local',
            createdAt: Date.now(),
        });

        const token = await generateToken(result.insertedId.toString(), email);

        return c.json({
            message: 'Registration successful',
            token,
            user: {
                id: result.insertedId.toString(),
                email,
                name,
                authProvider: 'local',
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        return c.json({ error: 'Registration failed' }, 500);
    }
});

// Login with email/password
auth.post('/login', async (c) => {
    try {
        const { email, password } = await c.req.json();

        if (!email || !password) {
            return c.json({ error: 'Email and password are required' }, 400);
        }

        const db = getDB();
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return c.json({ error: 'Invalid email or password' }, 401);
        }

        if (!user.password) {
            return c.json({ error: 'Please login with Google' }, 401);
        }

        const isValidPassword = await Bun.password.verify(password, user.password);
        if (!isValidPassword) {
            return c.json({ error: 'Invalid email or password' }, 401);
        }

        const token = await generateToken(user._id.toString(), email);

        return c.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                authProvider: user.authProvider,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return c.json({ error: 'Login failed' }, 500);
    }
});

// Google SSO callback
auth.post('/google', async (c) => {
    try {
        const { code, redirectUri } = await c.req.json();

        if (!code) {
            return c.json({ error: 'Authorization code is required' }, 400);
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return c.json({ error: 'Google OAuth not configured' }, 500);
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri || process.env.GOOGLE_CALLBACK_URL || '',
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Google token error:', tokenData);
            return c.json({ error: 'Failed to exchange authorization code' }, 400);
        }

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const googleUser = await userInfoResponse.json();

        if (!userInfoResponse.ok) {
            return c.json({ error: 'Failed to get user info from Google' }, 400);
        }

        const db = getDB();
        const usersCollection = db.collection('users');

        // Check if user exists
        let user = await usersCollection.findOne({
            $or: [
                { googleId: googleUser.id },
                { email: googleUser.email },
            ],
        });

        if (user) {
            // Update existing user with Google info if not already linked
            if (!user.googleId) {
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            googleId: googleUser.id,
                            avatar: googleUser.picture,
                            authProvider: user.password ? 'local' : 'google',
                        },
                    }
                );
            }
        } else {
            // Create new user
            const result = await usersCollection.insertOne({
                email: googleUser.email,
                password: null,
                name: googleUser.name,
                googleId: googleUser.id,
                avatar: googleUser.picture,
                authProvider: 'google',
                createdAt: Date.now(),
            });
            user = { _id: result.insertedId, ...googleUser };
        }

        const token = await generateToken(user._id.toString(), googleUser.email);

        return c.json({
            message: 'Google login successful',
            token,
            user: {
                id: user._id.toString(),
                email: googleUser.email,
                name: googleUser.name || user.name,
                avatar: googleUser.picture || user.avatar,
                authProvider: 'google',
            },
        });
    } catch (error) {
        console.error('Google auth error:', error);
        return c.json({ error: 'Google authentication failed' }, 500);
    }
});

// Get current user
auth.get('/me', authMiddleware, async (c) => {
    try {
        const { userId } = getAuth(c);
        const db = getDB();

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }

        return c.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                authProvider: user.authProvider,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        return c.json({ error: 'Failed to get user' }, 500);
    }
});

export default auth;
