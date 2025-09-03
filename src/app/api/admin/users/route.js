// src/app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { eq, desc, count, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import db from '@/lib/db/index.js';
import { users, portfolios } from '@/lib/db/schema.js';
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions.js';
import { requireAuth, createAuthResponse } from '@/lib/auth/middleware.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit.js';

export async function GET(request) {
  try {
    const session = await requireAuth(request);
    requirePermission(session.user.role, PERMISSIONS.MANAGE_USERS);

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        portfolioCount: count(portfolios.id)
      })
      .from(users)
      .leftJoin(portfolios, and(eq(users.id, portfolios.userId), eq(portfolios.isActive, true)))
      .groupBy(users.id, users.email, users.name, users.role, users.isActive, users.createdAt, users.updatedAt)
      .orderBy(desc(users.createdAt));

    return NextResponse.json(allUsers);
  } catch (error) {
    return createAuthResponse(error);
  }
}

export async function POST(request) {
  try {
    const session = await requireAuth(request);
    requirePermission(session.user.role, PERMISSIONS.MANAGE_USERS);

    const { email, name, password, role } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, nome e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica se l'email esiste già
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utente con questa email esiste già' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await db
      .insert(users)
      .values({
        email,
        name,
        password: hashedPassword,
        role: role || 'user',
        isActive: true
      })
      .returning();

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.CREATE_USER,
      targetType: TARGET_TYPES.USER,
      targetId: newUser[0].id,
      details: { email, name, role: role || 'user' },
      request
    });

    const { password: _, ...userWithoutPassword } = newUser[0];
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return createAuthResponse(error);
  }
}