// src/app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import { Users, Briefcase, TrendingUp, Activity, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency, formatNumber, CurrencyDisplay } from '@/lib/utils';

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
    <div className="layout-compact">
      {/* Header */}
      <div>
        <h1 className="heading-lg">Dashboard Amministratore</h1>
        <p className="text-gray-600">Panoramica del sistema e statistiche</p>
      </div>

      {/* Statistiche principali */}
      <div className="responsive-grid-cards">
        <div className="card-professional p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.users?.total || 0}</p>
              <p className="text-xs text-green-600">
                {stats?.users?.active || 0} attivi • {stats?.users?.admin || 0} admin
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="card-professional p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio Totali</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.portfolios?.total || 0}</p>
              <p className="text-xs text-green-600">
                {stats?.portfolios?.active || 0} attivi
              </p>
            </div>
            <Briefcase className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="card-professional p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Asset Totali</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.assets?.total || 0}</p>
              <p className="text-xs text-gray-600">
                Valore medio: {formatCurrency(stats?.financial?.averagePortfolioValue || 0)}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        <div className="card-professional p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valore Totale</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.financial?.totalValue || 0)}
              </p>
              <p className="text-xs">
                P&L: <CurrencyDisplay value={stats?.financial?.totalProfit || 0} showSign />
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Attività recenti e Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="card-professional p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-md">Utenti più Attivi</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats?.activity?.topUsers?.map((user, index) => (
              <div key={user.userId} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.userName}</p>
                    <p className="text-xs text-gray-500">{user.userEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user.portfolioCount}</p>
                  <p className="text-xs text-gray-500">portfolio</p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-sm">Nessun dato disponibile</p>
            )}
          </div>
        </div>

        {/* Top Portfolios */}
        <div className="card-professional p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-md">Portfolio con Maggior Valore</h3>
            <Briefcase className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats?.activity?.topPortfolios?.map((portfolio, index) => (
              <div key={portfolio.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{portfolio.name}</p>
                    <p className="text-xs text-gray-500">{portfolio.userName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(portfolio.totalValue)}</p>
                  <CurrencyDisplay 
                    value={portfolio.totalProfit} 
                    className="text-xs"
                    showSign 
                  />
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-sm">Nessun portfolio disponibile</p>
            )}
          </div>
        </div>
      </div>

      {/* Attività Recente */}
      <div className="card-professional p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-md">Attività Recente</h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        <div className="responsive-table-container">
          <table className="table-professional">
            <thead>
              <tr>
                <th>Utente</th>
                <th>Azione</th>
                <th>Target</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {stats?.activity?.recentActivity?.map((activity) => (
                <tr key={activity.id}>
                  <td>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{activity.userName}</div>
                      <div className="text-sm text-gray-500">{activity.userEmail}</div>
                    </div>
                  </td>
                  <td>
                    <span className="status-neutral">
                      {activity.action}
                    </span>
                  </td>
                  <td>
                    {activity.targetType}
                  </td>
                  <td>
                    {new Date(activity.timestamp).toLocaleDateString('it-IT')} {' '}
                    {new Date(activity.timestamp).toLocaleTimeString('it-IT')}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500">
                    Nessuna attività recente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Azioni rapide */}
      <div className="card-professional p-6">
        <h3 className="heading-md mb-4">Azioni Rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/admin/users'}
            className="card-compact hover:shadow-md transition-all text-left"
          >
            <Users className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Gestisci Utenti</h4>
            <p className="text-sm text-gray-600">Visualizza e modifica utenti</p>
          </button>

          <button
            onClick={() => window.location.href = '/admin/portfolios'}
            className="card-compact hover:shadow-md transition-all text-left"
          >
            <Briefcase className="h-6 w-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Visualizza Portfolio</h4>
            <p className="text-sm text-gray-600">Tutti i portfolio del sistema</p>
          </button>

          <button
            onClick={() => window.location.href = '/admin/audit'}
            className="card-compact hover:shadow-md transition-all text-left"
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