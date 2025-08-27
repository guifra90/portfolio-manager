// src/app/dashboard/lazy-portfolios/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  Star, 
  Calendar,
  TrendingUp,
  ExternalLink,
  Copy,
  Info,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { formatPercentage } from '@/lib/utils';

export default function LazyPortfoliosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCopyDialog, setShowCopyDialog] = useState(null);
  const [copyForm, setCopyForm] = useState({
    name: '',
    customCreatedAt: ''
  });
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (session) {
      fetchPortfolios();
    }
  }, [session]);

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

  const handleCopyPortfolio = async () => {
    if (!copyForm.name.trim()) {
      return;
    }

    setIsCopying(true);
    try {
      const response = await fetch(`/api/lazy-portfolios/${showCopyDialog.id}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: copyForm.name.trim(),
          customCreatedAt: copyForm.customCreatedAt || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCopyDialog(null);
        setCopyForm({ name: '', customCreatedAt: '' });
        
        // Reindirizza al nuovo portfolio
        router.push(`/dashboard/portfolio/${data.portfolio.id}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Errore nella copia del portfolio');
      }
    } catch (error) {
      console.error('Errore nella copia del portfolio:', error);
      alert('Errore nella copia del portfolio');
    } finally {
      setIsCopying(false);
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

  const getRiskDescription = (level) => {
    const descriptions = {
      1: 'Molto Conservativo',
      2: 'Conservativo',
      3: 'Moderato',
      4: 'Moderato-Aggressivo',
      5: 'Aggressivo'
    };
    return descriptions[level] || 'Non specificato';
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
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="heading-lg">Lazy Portfolios</h1>
          <p className="text-gray-600">Scegli un portfolio predefinito per iniziare ad investire</p>
        </div>
      </div>

      {/* Descrizione */}
      <div className="card-professional p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="heading-md mb-2">Cosa sono i Lazy Portfolios?</h3>
            <p className="text-gray-700 mb-4">
              I Lazy Portfolios sono strategie di investimento passive che utilizzano pochi ETF diversificati 
              per creare un portafoglio bilanciato. Sono progettati per essere semplici da gestire e richiedere 
              ribilanciamenti poco frequenti.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Gestione semplificata</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Diversificazione automatica</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Costi contenuti</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      {portfolios.length === 0 ? (
        <div className="card-professional p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun portfolio disponibile</h3>
          <p className="text-gray-600">I portfolio non sono ancora stati configurati dall'amministratore</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="card-professional overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {portfolio.name}
                    </h3>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        {getRiskStars(portfolio.riskLevel)}
                        <span className="ml-2 text-sm text-gray-600">
                          {getRiskDescription(portfolio.riskLevel)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {portfolio.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dettagli */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>
                      <span className="text-gray-600">Ribilanciamento:</span>
                      <span className="ml-1 font-medium">{getFrequencyLabel(portfolio.rebalancingFrequency)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span>
                      <span className="text-gray-600">ETF:</span>
                      <span className="ml-1 font-medium">{portfolio.etfs?.length || 0}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ETF List */}
              {portfolio.etfs && portfolio.etfs.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Composizione ETF:</h4>
                  <div className="space-y-3">
                    {portfolio.etfs.map((etf) => (
                      <div key={etf.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{etf.name}</span>
                            {etf.justETFUrl && (
                              <a 
                                href={etf.justETFUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="Vedi su JustETF"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {etf.symbol} {etf.isin && `• ${etf.isin}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-lg">
                            {formatPercentage(etf.allocation, { isAlreadyPercentage: true, minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {portfolio.notes && (
                <div className="p-6 border-b border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">Note:</h5>
                    <p className="text-sm text-blue-800 leading-relaxed">{portfolio.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-6">
                <button
                  onClick={() => {
                    setShowCopyDialog(portfolio);
                    setCopyForm({ 
                      name: `Il mio ${portfolio.name}`,
                      customCreatedAt: '' 
                    });
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copia questo Portfolio
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Copy Dialog */}
      {showCopyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Copia Portfolio: {showCopyDialog.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome del tuo portfolio *
                </label>
                <input
                  type="text"
                  value={copyForm.name}
                  onChange={(e) => setCopyForm({ ...copyForm, name: e.target.value })}
                  className="input-primary w-full"
                  placeholder="Es. Il mio Three-Fund Portfolio"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data di creazione personalizzata (opzionale)
                </label>
                <input
                  type="date"
                  value={copyForm.customCreatedAt}
                  onChange={(e) => setCopyForm({ ...copyForm, customCreatedAt: e.target.value })}
                  className="input-primary w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lascia vuoto per usare la data odierna
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Verrà creato un nuovo portfolio personale con gli asset del modello. 
                  Potrai poi inserire quantità e prezzi nella sezione portfolio.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCopyDialog(null);
                  setCopyForm({ name: '', customCreatedAt: '' });
                }}
                className="btn-secondary"
                disabled={isCopying}
              >
                Annulla
              </button>
              <button
                onClick={handleCopyPortfolio}
                disabled={!copyForm.name.trim() || isCopying}
                className="btn-primary flex items-center gap-2"
              >
                {isCopying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Copiando...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Crea Portfolio
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}