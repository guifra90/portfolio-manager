// src/app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import { Users, Briefcase, TrendingUp, Activity, DollarSign, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento statistiche:', error);
    } finally {
      setIsLoading(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Amministratore</h1>
        <p className="text-gray-600">Panoramica del sistema e statistiche</p>
      </div>

      {/* Statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.userCount || 0}</p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio Totali</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.portfolioCount || 0}</p>
            </div>
            <Briefcase className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Asset Totali</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.assetCount || 0}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valore Totale</p>
              <p className="text-3xl font-bold text-gray-900">
                €{(stats?.totalValue || 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Attività recenti */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utenti attivi */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Attività Utenti</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Utenti attivi (30 giorni)</span>
              <span className="font-semibold text-gray-900">{stats?.activeUsers || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min(((stats?.activeUsers || 0) / (stats?.userCount || 1)) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Ultimi login */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ultimi Login</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats?.recentLogins?.slice(0, 5).map((login, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-gray-900">{login.userName}</p>
                  <p className="text-gray-500">{login.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900">
                    {new Date(login.timestamp).toLocaleDateString('it-IT')}
                  </p>
                  <p className="text-gray-500">{login.ipAddress}</p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-sm">Nessun login recente</p>
            )}
          </div>
        </div>
      </div>

      {/* Azioni rapide */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/admin/users'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Users className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Gestisci Utenti</h4>
            <p className="text-sm text-gray-600">Visualizza e modifica utenti</p>
          </button>

          <button
            onClick={() => window.location.href = '/admin/portfolios'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Briefcase className="h-6 w-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Visualizza Portfolio</h4>
            <p className="text-sm text-gray-600">Tutti i portfolio del sistema</p>
          </button>

          <button
            onClick={() => window.location.href = '/admin/audit'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Activity className="h-6 w-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Audit Log</h4>
            <p className="text-sm text-gray-600">Registro delle attività</p>
          </button>
        </div>
      </div>
    </div>
  );
}