import { Context, Next } from 'hono';
import { verify, sign } from 'hono/jwt';
import { getDB } from '../db';
import { ObjectId } from 'mongodb';

export interface JWTPayload {
    userId: string;
    email: string;
    exp: number;
}

export interface AuthContext {
    userId: string;
    email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export function generateToken(userId: string, email: string): string {
    const payload: JWTPayload = {
        userId,
        email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    };
    return sign(payload, JWT_SECRET);
}

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized: No token provided' }, 401);
    }

    const token = authHeader.substring(7);

    try {
        const payload = await verify(token, JWT_SECRET) as JWTPayload;

        // Verify user exists
        const db = getDB();
        const user = await db.collection('users').findOne({
            _id: new ObjectId(payload.userId)
        });

        if (!user) {
            return c.json({ error: 'Unauthorized: User not found' }, 401);
        }

        // Set user context
        c.set('auth', {
            userId: payload.userId,
            email: payload.email,
        } as AuthContext);

        await next();
    } catch (error) {
        return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
}

export function getAuth(c: Context): AuthContext {
    return c.get('auth') as AuthContext;
}
