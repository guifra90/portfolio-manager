// src/app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import db from '@/lib/db/index.js';
import { users, passwordResetTokens } from '@/lib/db/schema.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit.js';

// GET - Verifica validità token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token richiesto' }, { status: 400 });
    }

    // Verifica se il token esiste ed è valido
    const resetToken = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expires, new Date())
        )
      )
      .limit(1);

    if (!resetToken.length) {
      return NextResponse.json({ error: 'Token non valido o scaduto' }, { status: 400 });
    }

    // Verifica se l'utente esiste ancora
    const user = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.email, resetToken[0].email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true, 
      email: resetToken[0].email 
    });
  } catch (error) {
    console.error('Errore verifica token:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// POST - Reset password con token
export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token e nuova password richiesti' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La password deve essere di almeno 6 caratteri' }, { status: 400 });
    }

    // Verifica token valido
    const resetToken = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expires, new Date())
        )
      )
      .limit(1);

    if (!resetToken.length) {
      return NextResponse.json({ error: 'Token non valido o scaduto' }, { status: 400 });
    }

    // Hash nuova password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Aggiorna password utente
    const updatedUsers = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.email, resetToken[0].email))
      .returning({ id: users.id });

    if (!updatedUsers.length) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 400 });
    }

    // Marca token come utilizzato
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken[0].id));

    // Audit log
    await createAuditLog({
      userId: updatedUsers[0].id,
      action: AUDIT_ACTIONS.PASSWORD_RESET,
      targetType: TARGET_TYPES.USER,
      targetId: updatedUsers[0].id,
      details: { email: resetToken[0].email },
      request
    });

    return NextResponse.json({ 
      message: 'Password aggiornata con successo' 
    });
  } catch (error) {
    console.error('Errore reset password:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}