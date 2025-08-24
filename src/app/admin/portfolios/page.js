// src/app/admin/portfolios/page.js
'use client';

import { useState, useEffect } from 'react';
import { Briefcase, User, TrendingUp, Calendar, Search, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, CurrencyDisplay } from '@/lib/utils';

export default function AdminPortfoliosPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [deletingPortfolio, setDeletingPortfolio] = useState(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolios');
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedPortfolios = portfolios
    .filter(portfolio => 
      portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portfolio.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portfolio.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'updatedAt' || sortBy === 'createdAt' || sortBy === 'customCreatedAt') {
        // Per customCreatedAt, se è null/undefined, usiamo una data molto vecchia per l'ordinamento
        if (sortBy === 'customCreatedAt') {
          aValue = aValue ? new Date(aValue) : new Date('1900-01-01');
          bValue = bValue ? new Date(bValue) : new Date('1900-01-01');
        } else {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getTotalStats = () => {
    const total = filteredAndSortedPortfolios.reduce((acc, portfolio) => {
      acc.totalValue += portfolio.totalValue || 0;
      acc.totalProfit += portfolio.totalProfit || 0;
      acc.count += 1;
      return acc;
    }, { totalValue: 0, totalProfit: 0, count: 0 });
    
    return total;
  };

  const stats = getTotalStats();

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Portfolio</h2>
          <p className="text-gray-600">Visualizza e gestisci tutti i portfolio del sistema</p>
        </div>
        <Link 
          href="/admin"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Torna al Dashboard
        </Link>
      </div>

      {/* Statistiche Riassuntive */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio Totali</p>
              <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valore Totale</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">P&L Totale</p>
              <CurrencyDisplay 
                value={stats.totalProfit} 
                className="text-2xl font-bold"
                showSign
              />
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valore Medio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.count > 0 ? Math.round(stats.totalValue / stats.count) : 0)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Controlli */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Ricerca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Cerca portfolio o utente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Ordinamento */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="updatedAt">Data Aggiornamento</option>
              <option value="customCreatedAt">Data Creazione Personalizzata</option>
              <option value="createdAt">Data Creazione Sistema</option>
              <option value="name">Nome</option>
              <option value="totalValue">Valore</option>
              <option value="totalProfit">P&L</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista Portfolio */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Portfolio
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('userName')}
                >
                  Proprietario
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalValue')}
                >
                  Valore
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalProfit')}
                >
                  P&L
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('customCreatedAt')}
                >
                  Data Creazione
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('updatedAt')}
                >
                  Ultimo Aggiornamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedPortfolios.map((portfolio) => (
                <tr key={portfolio.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{portfolio.name}</div>
                        <div className="text-sm text-gray-500">{portfolio.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{portfolio.userName}</div>
                        <div className="text-sm text-gray-500">{portfolio.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(portfolio.totalValue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CurrencyDisplay 
                      value={portfolio.totalProfit}
                      className="text-sm font-semibold"
                      showSign
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="text-sm text-gray-900">
                        {portfolio.customCreatedAt ? 
                          new Date(portfolio.customCreatedAt).toLocaleDateString('it-IT') : 
                          <span className="text-gray-400 italic">Non specificata</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="text-sm text-gray-900">
                        {new Date(portfolio.updatedAt).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/portfolio/${portfolio.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Visualizza Portfolio"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setEditingPortfolio(portfolio)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Modifica Portfolio"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingPortfolio(portfolio)}
                        className="text-red-600 hover:text-red-900"
                        title="Elimina Portfolio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedPortfolios.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun portfolio trovato</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Prova a modificare i criteri di ricerca.' : 'Non ci sono portfolio nel sistema.'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Portfolio Modal */}
      {editingPortfolio && (
        <EditPortfolioModal 
          portfolio={editingPortfolio}
          onClose={() => setEditingPortfolio(null)}
          onSuccess={() => {
            fetchPortfolios();
            setEditingPortfolio(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPortfolio && (
        <DeleteConfirmationModal 
          portfolio={deletingPortfolio}
          onClose={() => setDeletingPortfolio(null)}
          onSuccess={() => {
            fetchPortfolios();
            setDeletingPortfolio(null);
          }}
        />
      )}
    </div>
  );
}

// Componente Modal per modificare portfolio (Admin)
function EditPortfolioModal({ portfolio, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: portfolio.name,
    description: portfolio.description || '',
    customCreatedAt: portfolio.customCreatedAt ? new Date(portfolio.customCreatedAt).toISOString().split('T')[0] : ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nella modifica del portfolio');
      }
    } catch (error) {
      setError('Errore nella modifica del portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Modifica Portfolio - {portfolio.userName}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium">Proprietario: {portfolio.userName}</p>
                <p className="text-blue-600">{portfolio.userEmail}</p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Portfolio
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nome del portfolio"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione (opzionale)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Descrizione del portfolio..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data di creazione (opzionale)
            </label>
            <input
              type="date"
              value={formData.customCreatedAt}
              onChange={(e) => setFormData(prev => ({ ...prev, customCreatedAt: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Data personalizzata di creazione del portfolio. Se vuota, sarà utilizzata la data di sistema.
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Aggiornamento...' : 'Aggiorna Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal per conferma cancellazione (Admin)
function DeleteConfirmationModal({ portfolio, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nella cancellazione del portfolio');
      }
    } catch (error) {
      setError('Errore nella cancellazione del portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Elimina Portfolio</h3>
            <p className="text-sm text-gray-600">Azione amministrativa - Non può essere annullata</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <div className="text-sm">
              <p className="text-blue-800 font-medium">Proprietario: {portfolio.userName}</p>
              <p className="text-blue-600">{portfolio.userEmail}</p>
              <p className="text-blue-600">Valore: {formatCurrency(portfolio.totalValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Sei sicuro di voler eliminare il portfolio{' '}
            <strong className="text-gray-900">"{portfolio.name}"</strong>?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex">
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">Attenzione:</h4>
                <div className="mt-1 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tutti gli asset contenuti saranno eliminati</li>
                    <li>I dati storici andranno persi definitivamente</li>
                    <li>L'utente proprietario non potrà più accedervi</li>
                    <li>L'operazione è irreversibile</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Eliminazione...' : 'Elimina Portfolio'}
          </button>
        </div>
      </div>
    </div>
  );
}