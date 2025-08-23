// src/app/auth/forgot-password/page.js
'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!email.trim()) {
      setError('Email richiesta');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSubmitted(true);
        
        // Solo per development - mostra il link diretto
        if (data.resetUrl) {
          setMessage(prev => `${prev}\n\nPer il testing, usa questo link: ${data.resetUrl}`);
        }
      } else {
        setError(data.error || 'Errore nell\'invio della richiesta');
      }
    } catch (error) {
      console.error('Errore:', error);
      setError('Errore nell\'invio della richiesta');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="card-professional p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="heading-lg mb-4">Email Inviata!</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 text-sm whitespace-pre-line">{message}</p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Controlla la tua casella email e segui le istruzioni per reimpostare la password.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                    setMessage('');
                  }}
                  className="btn-secondary w-full"
                >
                  Invia di nuovo
                </button>
                
                <Link href="/auth/signin" className="btn-primary w-full text-center">
                  Torna al Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card-professional p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="heading-lg">Recupera Password</h2>
            <p className="text-gray-600 text-sm mt-2">
              Inserisci la tua email per ricevere le istruzioni per il reset della password
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="heading-sm mb-2">Indirizzo Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-professional pl-10"
                  placeholder="tua@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Invio...' : 'Invia Istruzioni'}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna al Login
            </Link>
          </div>

          {/* Security note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700 text-xs">
              <strong>Nota sulla sicurezza:</strong> Per motivi di sicurezza, riceverai un messaggio di conferma 
              anche se l'email non è registrata nel nostro sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}