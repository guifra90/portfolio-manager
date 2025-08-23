// src/app/api/user/profile/route.js
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import db from '@/lib/db/index.js';
import { users } from '@/lib/db/schema.js';
import { requireAuth, createAuthResponse } from '@/lib/auth/middleware.js';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit.js';

// GET - Ottieni profilo utente
export async function GET(request) {
  try {
    const session = await requireAuth(request);
    
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    return NextResponse.json(user[0]);
  } catch (error) {
    return createAuthResponse(error);
  }
}

// PUT - Aggiorna profilo utente
export async function PUT(request) {
  try {
    const session = await requireAuth(request);
    const { name, email, currentPassword, newPassword } = await request.json();

    // Validazione input
    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email sono obbligatori' }, { status: 400 });
    }

    // Verifica se l'email è già utilizzata da un altro utente
    if (email !== session.user.email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json({ error: 'Email già utilizzata da un altro utente' }, { status: 400 });
      }
    }

    // Prepara i dati da aggiornare
    const updateData = {
      name,
      email,
      updatedAt: new Date(),
    };

    // Se si vuole cambiare la password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Password attuale richiesta per cambiarla' }, { status: 400 });
      }

      // Verifica password attuale
      const currentUser = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      const isValidPassword = await bcrypt.compare(currentPassword, currentUser[0].password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 400 });
      }

      // Hash nuova password
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'La nuova password deve essere di almeno 6 caratteri' }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Aggiorna l'utente
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.UPDATE_PROFILE,
      targetType: TARGET_TYPES.USER,
      targetId: session.user.id,
      details: { 
        updatedFields: Object.keys(updateData).filter(k => k !== 'password'),
        passwordChanged: !!newPassword 
      },
      request
    });

    // Ritorna i dati aggiornati (senza password)
    const updatedUser = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error('Errore aggiornamento profilo:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}