// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import db from '@/lib/db/index.js';
import { users } from '@/lib/db/schema.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/auth/audit.js';

export async function POST(request) {
  try {
    const { email, name, password } = await request.json();

    // Validazione input
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      );
    }

    // Verifica se l'utente esiste già
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utente con questa email esiste già' },
        { status: 409 }
      );
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crea il nuovo utente (sempre con ruolo 'user')
    const newUser = await db
      .insert(users)
      .values({
        email,
        name,
        password: hashedPassword,
        role: 'user',
      })
      .returning();

    // Audit log
    await createAuditLog({
      userId: newUser[0].id,
      action: AUDIT_ACTIONS.CREATE_USER,
      targetType: TARGET_TYPES.USER,
      targetId: newUser[0].id,
      details: { email, name, role: 'user', selfRegistration: true },
      request
    });

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = newUser[0];

    return NextResponse.json(
      { 
        message: 'Utente creato con successo',
        user: userWithoutPassword
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}