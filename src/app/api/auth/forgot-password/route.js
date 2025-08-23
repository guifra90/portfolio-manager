// src/app/api/auth/forgot-password/route.js
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import db from '@/lib/db/index.js';
import { users, passwordResetTokens } from '@/lib/db/schema.js';

// POST - Richiesta reset password
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 });
    }

    // Verifica se l'utente esiste
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Per sicurezza, rispondiamo sempre con successo anche se l'email non esiste
    // Questo previene l'enumerazione degli utenti
    if (!existingUser.length || !existingUser[0].isActive) {
      return NextResponse.json({ 
        message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il reset della password' 
      });
    }

    // Genera token sicuro
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minuti

    // Salva token nel database
    await db
      .insert(passwordResetTokens)
      .values({
        email,
        token,
        expires,
      });

    // In un'applicazione reale, qui invieresti l'email
    // Per ora simuliamo con un log
    console.log(`Password reset requested for ${email}`);
    console.log(`Reset token: ${token}`);
    console.log(`Reset link: http://localhost:3000/auth/reset-password?token=${token}`);
    
    // Simulazione invio email
    // await sendPasswordResetEmail(email, token);

    return NextResponse.json({ 
      message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il reset della password',
      // Solo per development - rimuovi in produzione
      ...(process.env.NODE_ENV === 'development' && { token, resetUrl: `http://localhost:3000/auth/reset-password?token=${token}` })
    });
  } catch (error) {
    console.error('Errore reset password:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}