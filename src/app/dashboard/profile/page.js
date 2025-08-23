// src/app/dashboard/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Lock, Shield, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData(prev => ({
          ...prev,
          name: data.name || '',
          email: data.email || ''
        }));
      } else {
        setError('Errore nel caricamento del profilo');
      }
    } catch (error) {
      console.error('Errore:', error);
      setError('Errore nel caricamento del profilo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    // Validazioni
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Nome e email sono obbligatori');
      setIsSaving(false);
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Le nuove password non coincidono');
      setIsSaving(false);
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError('La nuova password deve essere di almeno 6 caratteri');
      setIsSaving(false);
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setError('Inserisci la password attuale per cambiarla');
      setIsSaving(false);
      return;
    }

    try {
      const requestData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      // Include password change data only if needed
      if (formData.newPassword) {
        requestData.currentPassword = formData.currentPassword;
        requestData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        setMessage('Profilo aggiornato con successo!');
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        // Update session if email changed
        if (data.email !== session?.user?.email) {
          await update({
            ...session,
            user: {
              ...session.user,
              email: data.email,
              name: data.name
            }
          });
        }

        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Errore nell\'aggiornamento del profilo');
      }
    } catch (error) {
      console.error('Errore:', error);
      setError('Errore nell\'aggiornamento del profilo');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="layout-compact max-w-2xl mx-auto">
      {/* Header */}
      <div className="card-professional p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="heading-lg">Il mio Profilo</h1>
            <p className="text-gray-500 text-sm">Gestisci le tue informazioni personali e la sicurezza del tuo account</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Shield className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-600">Ruolo</p>
            <p className="text-sm font-bold text-gray-900 capitalize">{profile?.role}</p>
          </div>
          <div className="text-center">
            <User className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-600">Account creato</p>
            <p className="text-sm font-bold text-gray-900">
              {new Date(profile?.createdAt).toLocaleDateString('it-IT')}
            </p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-600">Stato</p>
            <p className="text-sm font-bold text-green-600">Attivo</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card-professional p-6">
        <h2 className="heading-md mb-4">Aggiorna Informazioni</h2>
        
        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        
        {message && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
            <CheckCircle className="w-5 h-5" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="layout-compact">
          {/* Basic Info */}
          <div className="responsive-form-grid">
            <div>
              <label className="heading-sm mb-2">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-professional pl-10"
                  placeholder="Il tuo nome"
                />
              </div>
            </div>

            <div>
              <label className="heading-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-professional pl-10"
                  placeholder="tua@email.com"
                />
              </div>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="heading-md mb-4">Cambia Password (Opzionale)</h3>
            
            <div className="responsive-form-grid">
              <div>
                <label className="heading-sm mb-2">Password Attuale</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="input-professional pl-10 pr-10"
                    placeholder="Password attuale"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="heading-sm mb-2">Nuova Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="input-professional pl-10 pr-10"
                    placeholder="Nuova password"
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="heading-sm mb-2">Conferma Nuova Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="input-professional pl-10 pr-10"
                  placeholder="Conferma nuova password"
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}