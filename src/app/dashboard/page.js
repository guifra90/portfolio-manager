// src/app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Briefcase, TrendingUp, DollarSign, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, CurrencyDisplay } from '@/lib/utils';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      <div className="responsive-flex-header">
        <div>
          <h2 className="heading-lg">I tuoi Portfolio</h2>
          <p className="text-gray-500 text-sm mt-1">Gestisci e monitora i tuoi investimenti</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary btn-compact flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="sm:inline">Nuovo Portfolio</span>
        </button>
      </div>

      {/* Portfolio Grid */}
      {portfolios.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun portfolio</h3>
          <p className="mt-1 text-sm text-gray-500">
            Inizia creando il tuo primo portfolio di investimenti
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus className="h-4 w-4" />
              Crea Portfolio
            </button>
          </div>
        </div>
      ) : (
        <div className="responsive-grid-cards">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="card-professional">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="heading-md">{portfolio.name}</h3>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const menu = e.currentTarget.nextElementSibling;
                          menu.classList.toggle('hidden');
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Opzioni"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 hidden">
                        <div className="py-1">
                          <Link
                            href={`/dashboard/portfolio/${portfolio.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Visualizza Portfolio
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingPortfolio(portfolio);
                              e.currentTarget.closest('.absolute').classList.add('hidden');
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifica
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setDeletingPortfolio(portfolio);
                              e.currentTarget.closest('.absolute').classList.add('hidden');
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link href={`/dashboard/portfolio/${portfolio.id}`}>
                  <div className="cursor-pointer">
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{portfolio.description}</p>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Valore Totale</span>
                        <span className="font-semibold text-sm text-gray-900">
                          {formatCurrency(portfolio.totalValue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">P&L</span>
                        <CurrencyDisplay 
                          value={portfolio.totalProfit}
                          className="font-semibold text-sm"
                          showSign
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Aggiornato: {new Date(portfolio.updatedAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <CreatePortfolioModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchPortfolios}
        />
      )}

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

// Componente Modal per creare portfolio
function CreatePortfolioModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nella creazione del portfolio');
      }
    } catch (error) {
      setError('Errore nella creazione del portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Crea Nuovo Portfolio</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
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
              placeholder="Il mio portfolio ETF"
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
              {isLoading ? 'Creazione...' : 'Crea Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal per modificare portfolio
function EditPortfolioModal({ portfolio, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: portfolio.name,
    description: portfolio.description || ''
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifica Portfolio</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
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
              placeholder="Il mio portfolio ETF"
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

// Componente Modal per conferma cancellazione
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
            <p className="text-sm text-gray-600">Questa azione non può essere annullata</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
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
                    <li>I dati storici andranno persi</li>
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