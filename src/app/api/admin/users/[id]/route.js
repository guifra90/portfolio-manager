// src/app/api/admin/users/[id]/route.js
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import db from '@/lib/db/index.js';
import { users } from '@/lib/db/schema.js';
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions.js';
import { requireAuth, createAuthResponse } from '@/lib/auth/middleware.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit.js';

export async function GET(request, { params }) {
  try {
    const session = await requireAuth(request);
    requirePermission(session.user.role, PERMISSIONS.MANAGE_USERS);

    const user = await db.select().from(users).where(eq(users.id, params.id)).get();
    
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return createAuthResponse(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await requireAuth(request);
    requirePermission(session.user.role, PERMISSIONS.MANAGE_USERS);

    const { name, email, role, isActive, password } = await request.json();

    // Verifica che l'utente esista
    const existingUser = await db.select().from(users).where(eq(users.id, params.id)).get();
    if (!existingUser) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Non permettere all'admin di disattivare se stesso
    if (session.user.id === params.id && isActive === false) {
      return NextResponse.json(
        { error: 'Non puoi disattivare il tuo stesso account' },
        { status: 400 }
      );
    }

    // Prepara i dati di aggiornamento
    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, params.id))
      .returning();

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.UPDATE_USER,
      targetType: TARGET_TYPES.USER,
      targetId: params.id,
      details: { 
        updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt' && key !== 'password'),
        previousRole: existingUser.role,
        newRole: role,
        previousActive: existingUser.isActive,
        newActive: isActive
      },
      request
    });

    const { password: _, ...userWithoutPassword } = updatedUser[0];
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return createAuthResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth(request);
    requirePermission(session.user.role, PERMISSIONS.MANAGE_USERS);

    // Non permettere all'admin di cancellare se stesso
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Non puoi cancellare il tuo stesso account' },
        { status: 400 }
      );
    }

    const existingUser = await db.select().from(users).where(eq(users.id, params.id)).get();
    if (!existingUser) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    await db.delete(users).where(eq(users.id, params.id));

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.DELETE_USER,
      targetType: TARGET_TYPES.USER,
      targetId: params.id,
      details: { 
        deletedUser: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        }
      },
      request
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createAuthResponse(error);
  }
}