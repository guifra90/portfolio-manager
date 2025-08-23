// src/app/auth/reset-password/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token non fornito');
      setIsValidatingToken(false);
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (response.ok) {
        setIsTokenValid(true);
        setUserEmail(data.email);
      } else {
        setError(data.error || 'Token non valido');
        setIsTokenValid(false);
      }
    } catch (error) {
      console.error('Errore validazione token:', error);
      setError('Errore nella validazione del token');
      setIsTokenValid(false);
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    // Validazioni
    if (!passwords.newPassword || !passwords.confirmPassword) {
      setError('Inserisci entrambe le password');
      setIsLoading(false);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Le password non coincidono');
      setIsLoading(false);
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      } else {
        setError(data.error || 'Errore nel reset della password');
      }
    } catch (error) {
      console.error('Errore:', error);
      setError('Errore nel reset della password');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card-professional p-8 text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Validazione token in corso...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="card-professional p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="heading-lg mb-4">Password Aggiornata!</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 text-sm">{message}</p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Verrai reindirizzato alla pagina di login tra pochi secondi...
              </p>
              
              <Link href="/auth/signin" className="btn-primary w-full">
                Vai al Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="card-professional p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="heading-lg mb-4">Token Non Valido</h2>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>

            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                Il token di reset password non è valido o è scaduto.
              </p>
              
              <div className="flex flex-col gap-3">
                <Link href="/auth/forgot-password" className="btn-secondary w-full">
                  Richiedi Nuovo Reset
                </Link>
                
                <Link href="/auth/signin" className="btn-primary w-full">
                  Torna al Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card-professional p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="heading-lg">Nuova Password</h2>
            <p className="text-gray-600 text-sm mt-2">
              Imposta una nuova password per <strong>{userEmail}</strong>
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
          <form onSubmit={handleSubmit} className="layout-compact">
            <div>
              <label className="heading-sm mb-2">Nuova Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="input-professional pl-10 pr-10"
                  placeholder="Inserisci nuova password"
                  minLength="6"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="heading-sm mb-2">Conferma Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="input-professional pl-10 pr-10"
                  placeholder="Conferma nuova password"
                  minLength="6"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {isLoading ? 'Aggiornamento...' : 'Aggiorna Password'}
            </button>
          </form>

          {/* Password requirements */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700 text-xs">
              <strong>Requisiti password:</strong> La password deve essere di almeno 6 caratteri.
              Per sicurezza, utilizza una combinazione di lettere maiuscole, minuscole, numeri e simboli.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}