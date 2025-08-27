// src/app/admin/lazy-portfolios/page.js
'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Calendar,
  TrendingUp,
  ExternalLink,
  Eye,
  AlertTriangle 
} from 'lucide-react';
import { formatPercentage } from '@/lib/utils';

export default function AdminLazyPortfolios() {
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/lazy-portfolios?include-etfs=true');
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei portfolios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (portfolioId) => {
    try {
      const response = await fetch(`/api/lazy-portfolios/${portfolioId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPortfolios(portfolios.filter(p => p.id !== portfolioId));
        setShowDeleteDialog(null);
      } else {
        console.error('Errore nell\'eliminazione del portfolio');
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del portfolio:', error);
    }
  };

  const handleToggleActive = async (portfolio) => {
    try {
      const response = await fetch(`/api/lazy-portfolios/${portfolio.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...portfolio,
          isActive: !portfolio.isActive,
        }),
      });

      if (response.ok) {
        await fetchPortfolios();
      } else {
        console.error('Errore nell\'aggiornamento del portfolio');
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del portfolio:', error);
    }
  };

  const getRiskStars = (level) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < level ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      'trimestrale': 'Trimestrale',
      'semestrale': 'Semestrale',
      'annuale': 'Annuale'
    };
    return labels[frequency] || frequency;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="heading-lg">Gestione Lazy Portfolios</h1>
          <p className="text-gray-600">Gestisci i modelli di portfolio predefiniti</p>
        </div>
        <button
          onClick={() => {
            setEditingPortfolio(null);
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuovo Portfolio
        </button>
      </div>

      {/* Statistiche */}
      <div className="responsive-grid-cards">
        <div className="card-professional p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio Totali</p>
              <p className="text-3xl font-bold text-gray-900">{portfolios.length}</p>
              <p className="text-xs text-green-600">
                {portfolios.filter(p => p.isActive).length} attivi
              </p>
            </div>
            <Briefcase className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="card-professional p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ETF Totali</p>
              <p className="text-3xl font-bold text-gray-900">
                {portfolios.reduce((total, p) => total + (p.etfs?.length || 0), 0)}
              </p>
              <p className="text-xs text-gray-600">
                Media: {portfolios.length > 0 ? 
                  Math.round(portfolios.reduce((total, p) => total + (p.etfs?.length || 0), 0) / portfolios.length) : 0} per portfolio
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="card-professional p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rischio Medio</p>
              <div className="flex items-center gap-1 mt-1">
                {getRiskStars(Math.round(portfolios.reduce((total, p) => total + p.riskLevel, 0) / portfolios.length))}
              </div>
              <p className="text-xs text-gray-600">
                {portfolios.length > 0 ? 
                  `${(portfolios.reduce((total, p) => total + p.riskLevel, 0) / portfolios.length).toFixed(1)}/5` : '0/5'}
              </p>
            </div>
            <Star className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="card-professional p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ribilanciamenti</p>
              <p className="text-xs text-gray-600 mt-2">
                Trimestrale: {portfolios.filter(p => p.rebalancingFrequency === 'trimestrale').length}
              </p>
              <p className="text-xs text-gray-600">
                Semestrale: {portfolios.filter(p => p.rebalancingFrequency === 'semestrale').length}
              </p>
              <p className="text-xs text-gray-600">
                Annuale: {portfolios.filter(p => p.rebalancingFrequency === 'annuale').length}
              </p>
            </div>
            <Calendar className="h-12 w-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Lista Portfolios */}
      <div className="card-professional">
        <div className="p-6 border-b border-gray-200">
          <h3 className="heading-md">Portfolio Disponibili</h3>
        </div>
        
        {portfolios.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun portfolio disponibile</h3>
            <p className="text-gray-600 mb-6">Inizia creando il tuo primo lazy portfolio</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Crea Primo Portfolio
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {portfolios.map((portfolio) => (
              <div key={portfolio.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {portfolio.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        {getRiskStars(portfolio.riskLevel)}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        portfolio.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {portfolio.isActive ? 'Attivo' : 'Inattivo'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{portfolio.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Ribilanciamento: {getFrequencyLabel(portfolio.rebalancingFrequency)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{portfolio.etfs?.length || 0} ETF</span>
                      </div>
                    </div>

                    {/* ETF List */}
                    {portfolio.etfs && portfolio.etfs.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">Composizione ETF:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {portfolio.etfs.map((etf) => (
                            <div key={etf.id} className="flex items-center justify-between bg-white rounded p-3 border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{etf.name}</span>
                                  {etf.justETFUrl && (
                                    <a 
                                      href={etf.justETFUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {etf.symbol} {etf.isin && `• ${etf.isin}`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">
                                  {formatPercentage(etf.allocation, { isAlreadyPercentage: true, minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {portfolio.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">{portfolio.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(portfolio)}
                      className={`p-2 rounded-lg transition-colors ${
                        portfolio.isActive 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={portfolio.isActive ? 'Disattiva portfolio' : 'Attiva portfolio'}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingPortfolio(portfolio);
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Modifica portfolio"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog(portfolio)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Elimina portfolio"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Conferma Eliminazione</h3>
                <p className="text-gray-600">Questa azione non può essere annullata</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Sei sicuro di voler eliminare il portfolio <strong>{showDeleteDialog.name}</strong>? 
              Tutti gli ETF associati verranno eliminati.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="btn-secondary"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(showDeleteDialog.id)}
                className="btn-danger"
              >
                Elimina Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}