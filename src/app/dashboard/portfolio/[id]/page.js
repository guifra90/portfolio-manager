// src/app/dashboard/portfolio/[id]/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, RefreshCw, Plus, Minus, Calculator, ExternalLink, Edit, Trash2, Calendar, Save, History } from 'lucide-react';
import { formatCurrency, formatPercentage, CurrencyDisplay, PercentageDisplay } from '@/lib/utils';

export default function PortfolioDetailPage() {
  const params = useParams();
  const portfolioId = params.id;
  
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRebalancing, setShowRebalancing] = useState(false);
  const [rebalancingMode, setRebalancingMode] = useState('sale');
  const [newLiquidity, setNewLiquidity] = useState(0);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [assetToEdit, setAssetToEdit] = useState(null);
  
  // Performance tracking state
  const [annualPerformances, setAnnualPerformances] = useState([]);
  const [showAddPerformance, setShowAddPerformance] = useState(false);
  const [performanceToEdit, setPerformanceToEdit] = useState(null);
  const [performanceToDelete, setPerformanceToDelete] = useState(null);
  
  // Transaction history state
  const [transactions, setTransactions] = useState([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [isSavingRebalancing, setIsSavingRebalancing] = useState(false);
  const [showAddCashModal, setShowAddCashModal] = useState(false);

  useEffect(() => {
    fetchPortfolio();
    fetchAnnualPerformances();
    fetchTransactions();
  }, [portfolioId]);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`);
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento del portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnnualPerformances = async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/performance`);
      if (response.ok) {
        const data = await response.json();
        setAnnualPerformances(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle performance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/transactions`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle transazioni:', error);
    }
  };

  const saveRebalancing = async (useRounded = true) => {
    if (!rebalancingCalculations.length) return;

    setIsSavingRebalancing(true);
    
    try {
      // Prepara le transazioni per l'API (sceglie tra valori esatti o arrotondati)
      const transactionsToSave = rebalancingCalculations
        .filter(asset => {
          const qty = useRounded ? Math.abs(asset.roundedQuantityDelta) : Math.abs(asset.quantityDelta);
          return qty > (useRounded ? 0 : 0.01); // Solo transazioni significative
        })
        .map(asset => {
          const quantity = useRounded ? Math.abs(asset.roundedQuantityDelta) : Math.abs(asset.quantityDelta);
          const action = useRounded ? asset.roundedAction : asset.action;
          
          return {
            assetId: asset.id,
            assetSymbol: asset.symbol,
            action: action,
            quantity: quantity,
            price: asset.currentPrice,
            fees: 0, // Potresti aggiungere un campo per le commissioni nel UI
          };
        });

      // Mappa le azioni italiane a quelle inglesi
      const mappedTransactions = transactionsToSave.map(t => ({
        ...t,
        action: t.action === 'ACQUISTA' ? 'BUY' : 'SELL'
      }));

      const rebalancingData = {
        transactions: mappedTransactions,
        cashDeposit: rebalancingMode === 'liquidity' ? newLiquidity : null,
        notes: `Ribilanciamento ${rebalancingMode === 'liquidity' ? 'con nuova liquidità' : 'vendita/acquisto'}`,
        executedAt: new Date(),
      };

      const response = await fetch(`/api/portfolios/${portfolioId}/rebalancing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rebalancingData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Ribilanciamento salvato con successo:', result);
        
        // Ricarica i dati
        await fetchTransactions();
        await fetchPortfolio();
        
        // Nascondi il calcolatore
        setShowRebalancing(false);
        
        alert(`Ribilanciamento salvato con successo!\n\n✅ ${result.transactions.length} transazioni create\n✅ Asset del portfolio aggiornati automaticamente\n✅ Allocazioni ricalcolate\n\nIl tuo portfolio è ora sincronizzato con le operazioni!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('Errore nel salvataggio del ribilanciamento:', error);
      alert('Errore nel salvataggio del ribilanciamento: ' + error.message);
    } finally {
      setIsSavingRebalancing(false);
    }
  };

  // Calcoli del portfolio
  const portfolioMetrics = useMemo(() => {
    if (!portfolio?.assets) return { 
      totalValue: 0, 
      totalProfit: 0, 
      returnPercentage: 0
    };
    
    const totalValue = portfolio.assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalProfit = portfolio.assets.reduce((sum, asset) => sum + asset.profitLoss, 0);
    const returnPercentage = totalValue > 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;
    
    
    return { 
      totalValue, 
      totalProfit, 
      returnPercentage
    };
  }, [portfolio, transactions]);

  // Calcolo del ribilanciamento
  const rebalancingCalculations = useMemo(() => {
    if (!portfolio?.assets || !showRebalancing) return [];
    
    const targetTotalValue = rebalancingMode === 'liquidity' 
      ? portfolioMetrics.totalValue + newLiquidity 
      : portfolioMetrics.totalValue;

    return portfolio.assets.map(asset => {
      const targetValue = targetTotalValue * asset.targetAllocation;
      const difference = targetValue - asset.currentValue;
      const quantityDelta = difference / asset.currentPrice;
      const newQuantity = asset.quantity + quantityDelta;

      // Calcoli per quantità arrotondate (più pratiche)
      const roundedQuantityDelta = Math.round(quantityDelta);
      const roundedNewQuantity = asset.quantity + roundedQuantityDelta;
      const roundedOperationAmount = Math.abs(roundedQuantityDelta * asset.currentPrice);
      const roundedDifference = roundedQuantityDelta * asset.currentPrice;

      return {
        ...asset,
        targetValue,
        difference,
        quantityDelta: quantityDelta,
        newQuantity: newQuantity,
        action: difference > 0 ? 'ACQUISTA' : 'VENDI',
        operationAmount: Math.abs(difference),
        // Valori arrotondati per praticità
        roundedQuantityDelta: roundedQuantityDelta,
        roundedNewQuantity: Math.max(0, roundedNewQuantity), // Non può essere negativo
        roundedOperationAmount: roundedOperationAmount,
        roundedAction: roundedQuantityDelta > 0 ? 'ACQUISTA' : roundedQuantityDelta < 0 ? 'VENDI' : 'NESSUNA AZIONE'
      };
    });
  }, [portfolio, portfolioMetrics.totalValue, rebalancingMode, newLiquidity, showRebalancing]);

  // Dati per i grafici
  const pieData = portfolio?.assets.map(asset => ({
    name: asset.symbol,
    value: asset.currentValue,
    allocation: asset.currentAllocation * 100,
    target: asset.targetAllocation * 100
  })) || [];

  const barData = portfolio?.assets.map(asset => ({
    symbol: asset.symbol,
    current: asset.currentAllocation * 100,
    target: asset.targetAllocation * 100,
    imbalance: asset.imbalance * 100
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const updateAssetPrice = async (assetId, newPrice) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPrice: newPrice,
        }),
      });

      if (response.ok) {
        fetchPortfolio(); // Ricarica i dati del portfolio
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del prezzo:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Portfolio non trovato</p>
      </div>
    );
  }

  return (
    <div className="layout-compact">
      {/* Header */}
      <div className="card-compact">
        <div className="responsive-flex-header">
          <div>
            <h1 className="heading-lg">{portfolio.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{portfolio.description}</p>
          </div>
          <button
            onClick={() => setShowAddAsset(true)}
            className="btn-primary btn-compact flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Aggiungi Asset</span>
          </button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="card-compact">
        <h3 className="heading-sm mb-3">Statistiche Portfolio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-blue-700">Valore Attuale</p>
            <p className="text-lg font-bold text-blue-800">{formatCurrency(portfolioMetrics.totalValue)}</p>
          </div>

          <div className={`text-center rounded-lg p-3 ${portfolioMetrics.totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-center mb-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${portfolioMetrics.totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {portfolioMetrics.totalProfit >= 0 ? 
                  <TrendingUp className="h-4 w-4 text-green-600" /> : 
                  <TrendingDown className="h-4 w-4 text-red-600" />
                }
              </div>
            </div>
            <p className={`text-xs font-medium ${portfolioMetrics.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Profitto/Perdita</p>
            <CurrencyDisplay 
              value={portfolioMetrics.totalProfit}
              className={`text-lg font-bold ${portfolioMetrics.totalProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}
              showSign
            />
          </div>

          <div className="text-center bg-purple-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-purple-700">Rendimento</p>
            <PercentageDisplay 
              value={portfolioMetrics.returnPercentage / 100}
              className="text-lg font-bold text-purple-800"
              showSign
            />
          </div>

          <div className="text-center bg-orange-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-orange-700">Asset</p>
            <p className="text-lg font-bold text-orange-800">{portfolio.assets.length}</p>
          </div>
        </div>
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grafico a torta */}
        <div className="card-compact">
          <h3 className="heading-sm mb-3">Allocazione Portfolio</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, allocation }) => `${name} (${allocation.toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Grafico a barre */}
        <div className="card-compact">
          <h3 className="heading-sm mb-3">Allocazione vs Target</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="symbol" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
              <Bar dataKey="target" fill="#94a3b8" name="Target" />
              <Bar dataKey="current" fill="#3b82f6" name="Attuale" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabella Asset */}
      <div className="card-professional overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="heading-sm">Dettaglio Asset</h3>
        </div>
        <div className="responsive-table-container">
          <table className="table-professional">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prezzo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prezzo Medio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantità</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocazione</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sbilanciamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolio.assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {asset.symbol}
                          {asset.justETFUrl && (
                            <a 
                              href={asset.justETFUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Visualizza su justETF"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{asset.name}</div>
                        {asset.isin && (
                          <div className="text-xs text-gray-400">ISIN: {asset.isin}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(asset.currentPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatCurrency(asset.averagePurchasePrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(asset.currentValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <CurrencyDisplay 
                      value={asset.profitLoss}
                      showSign
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPercentage(asset.currentAllocation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPercentage(asset.targetAllocation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      Math.abs(asset.imbalance) > 0.01 
                        ? asset.imbalance > 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {formatPercentage(asset.imbalance, { showSign: true })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAssetToEdit(asset)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Modifica asset"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setAssetToDelete(asset)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Cancella asset"
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
      </div>

      {/* Sezione Ribilanciamento */}
      <div className="card-compact">
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-sm">Calcolatore Ribilanciamento</h3>
          <Calculator className="h-5 w-5 text-blue-600" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modalità Ribilanciamento
            </label>
            <select 
              className="input-professional"
              value={rebalancingMode}
              onChange={(e) => setRebalancingMode(e.target.value)}
            >
              <option value="sale">Vendita/Acquisto Asset</option>
              <option value="liquidity">Aggiunta Nuova Liquidità</option>
            </select>
          </div>

          {rebalancingMode === 'liquidity' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuova Liquidità (€)
              </label>
              <input
                type="number"
                className="input-professional"
                value={newLiquidity}
                onChange={(e) => setNewLiquidity(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Azione
            </label>
            <button
              onClick={() => setShowRebalancing(!showRebalancing)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {showRebalancing ? 'Nascondi' : 'Calcola'} Ribilanciamento
            </button>
          </div>
        </div>

        {/* Risultati Ribilanciamento */}
        {showRebalancing && rebalancingCalculations.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-900">
                Operazioni Necessarie 
                {rebalancingMode === 'liquidity' && newLiquidity > 0 && 
                  ` (con ${formatCurrency(newLiquidity)} di nuova liquidità)`
                }
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveRebalancing(false)}
                  disabled={isSavingRebalancing}
                  className="btn-secondary btn-compact flex items-center gap-2 disabled:opacity-50"
                  title="Salva con quantità esatte (decimali)"
                >
                  <Save className="h-4 w-4" />
                  Salva Esatte
                </button>
                <button
                  onClick={() => saveRebalancing(true)}
                  disabled={isSavingRebalancing}
                  className="btn-primary btn-compact flex items-center gap-2 disabled:opacity-50"
                  title="Salva con quantità arrotondate (consigliate per ETF)"
                >
                  <Save className="h-4 w-4" />
                  {isSavingRebalancing ? 'Salvataggio...' : 'Salva Arrotondate ⭐'}
                </button>
              </div>
            </div>
            
            <div className="responsive-table-container">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azione</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>Quantità</div>
                      <div className="text-xs font-normal text-gray-400">(Esatta / Arrotondata)</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>Importo</div>
                      <div className="text-xs font-normal text-gray-400">(Esatto / Arrotondato)</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>Nuova Quantità</div>
                      <div className="text-xs font-normal text-gray-400">(Esatta / Arrotondata)</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore Target</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rebalancingCalculations.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {asset.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${
                            asset.roundedAction === 'ACQUISTA' 
                              ? 'bg-green-100 text-green-800' 
                              : asset.roundedAction === 'VENDI'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {asset.roundedAction === 'ACQUISTA' ? <Plus className="h-3 w-3" /> : 
                             asset.roundedAction === 'VENDI' ? <Minus className="h-3 w-3" /> : null}
                            {asset.roundedAction}
                          </span>
                          {asset.roundedAction === 'NESSUNA AZIONE' && (
                            <span className="text-xs text-gray-500">(già bilanciato)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="text-gray-600">
                            <span className="font-mono">{Math.abs(asset.quantityDelta).toFixed(2)}</span>
                            <span className="text-xs text-gray-400 ml-1">quote</span>
                          </div>
                          <div className="text-green-700 font-medium">
                            <span className="font-mono">{Math.abs(asset.roundedQuantityDelta)}</span>
                            <span className="text-xs text-green-600 ml-1">quote ⭐</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="text-gray-600 text-sm">
                            {formatCurrency(asset.operationAmount)}
                          </div>
                          <div className="text-green-700 font-medium">
                            {formatCurrency(asset.roundedOperationAmount)} ⭐
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="text-gray-600">
                            <span className="font-mono">{asset.newQuantity.toFixed(2)}</span>
                          </div>
                          <div className="text-green-700 font-medium">
                            <span className="font-mono">{asset.roundedNewQuantity}</span> ⭐
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(asset.targetValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Legenda per le quantità */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">ℹ</span>
                  </div>
                </div>
                <div className="text-sm">
                  <h4 className="font-medium text-blue-900 mb-1">Quantità Suggerite ⭐</h4>
                  <p className="text-blue-700 mb-2">
                    I valori <strong>arrotondati</strong> (⭐) sono consigliati per gli acquisti ETF poiché permettono di comprare solo quote intere, 
                    evitando frazioni difficili da gestire nelle piattaforme di trading.
                  </p>
                  <div className="text-xs text-blue-600">
                    • <strong>Quantità esatte</strong>: Ribilanciamento matematicamente perfetto<br/>
                    • <strong>Quantità arrotondate</strong>: Più pratiche per l'acquisto reale (consigliate)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sezione Performance Annuali */}
      <div className="card-compact">
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-sm">Performance Storiche</h3>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <button
              onClick={() => setShowAddPerformance(true)}
              className="btn-primary btn-compact flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Aggiungi Anno</span>
            </button>
          </div>
        </div>
        
        {annualPerformances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nessuna performance storica registrata</p>
            <p className="text-sm mt-1">Aggiungi le performance degli anni precedenti per tenere traccia della crescita del tuo portfolio</p>
          </div>
        ) : (
          <div className="responsive-table-container">
            <table className="table-professional">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anno</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profitto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perdita</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L Netto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore Portfolio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rendimento %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {annualPerformances.map((performance) => (
                  <tr key={performance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {performance.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      +{formatCurrency(performance.totalProfit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(performance.totalLoss)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <CurrencyDisplay 
                        value={performance.netProfitLoss}
                        showSign
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(performance.portfolioValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <PercentageDisplay 
                        value={performance.returnPercentage / 100}
                        showSign
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {performance.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPerformanceToEdit(performance)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Modifica performance"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPerformanceToDelete(performance)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Elimina performance"
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
        )}
      </div>

      {/* Sezione Storico Transazioni */}
      <div className="card-compact">
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-sm">Storico Transazioni</h3>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <button
              onClick={() => setShowAddCashModal(true)}
              className="btn-primary btn-compact flex items-center gap-2"
              title="Registra un apporto di liquidità manuale"
            >
              <Plus className="h-4 w-4" />
              Apporto Liquidità
            </button>
            <button
              onClick={() => setShowTransactionHistory(!showTransactionHistory)}
              className="btn-secondary btn-compact"
            >
              {showTransactionHistory ? 'Nascondi' : 'Mostra'} Storico
            </button>
          </div>
        </div>
        
        {showTransactionHistory && (
          <>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nessuna transazione registrata</p>
                <p className="text-sm mt-1">Le transazioni salvate dai ribilanciamenti appariranno qui</p>
              </div>
            ) : (
              <div className="responsive-table-container">
                <table className="table-professional">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantità</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prezzo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commissioni</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => {
                      const isPositive = transaction.amount > 0;
                      const typeLabels = {
                        'BUY': 'Acquisto',
                        'SELL': 'Vendita', 
                        'CASH_DEPOSIT': 'Apporto',
                        'CASH_WITHDRAWAL': 'Prelievo'
                      };
                      
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.executedAt).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              transaction.type === 'BUY' ? 'bg-red-100 text-red-800' :
                              transaction.type === 'SELL' ? 'bg-green-100 text-green-800' :
                              transaction.type === 'CASH_DEPOSIT' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {typeLabels[transaction.type] || transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.assetSymbol || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.quantity || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.price ? formatCurrency(transaction.price) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <CurrencyDisplay 
                              value={transaction.amount}
                              showSign
                              className={isPositive ? 'text-green-600' : 'text-red-600'}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.fees > 0 ? formatCurrency(transaction.fees) : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {transaction.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Riassunto liquidità totale investita */}
            {transactions.length > 0 && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Riassunto Liquidità</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Totale Apporti:</span>
                    <div className="font-semibold text-blue-900">
                      {formatCurrency(
                        transactions
                          .filter(t => t.type === 'CASH_DEPOSIT')
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700">Totale Acquisti:</span>
                    <div className="font-semibold text-blue-900">
                      {formatCurrency(
                        Math.abs(
                          transactions
                            .filter(t => t.type === 'BUY')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700">Totale Vendite:</span>
                    <div className="font-semibold text-blue-900">
                      {formatCurrency(
                        transactions
                          .filter(t => t.type === 'SELL')
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Asset Modal */}
      {showAddAsset && (
        <AddAssetModal 
          portfolioId={portfolioId}
          onClose={() => setShowAddAsset(false)}
          onSuccess={fetchPortfolio}
        />
      )}

      {/* Edit Asset Modal */}
      {assetToEdit && (
        <EditAssetModal 
          asset={assetToEdit}
          onClose={() => setAssetToEdit(null)}
          onSuccess={fetchPortfolio}
        />
      )}

      {/* Delete Asset Modal */}
      {assetToDelete && (
        <DeleteAssetModal 
          asset={assetToDelete}
          onClose={() => setAssetToDelete(null)}
          onSuccess={fetchPortfolio}
        />
      )}

      {/* Add Performance Modal */}
      {showAddPerformance && (
        <AddPerformanceModal 
          portfolioId={portfolioId}
          onClose={() => setShowAddPerformance(false)}
          onSuccess={fetchAnnualPerformances}
        />
      )}

      {/* Edit Performance Modal */}
      {performanceToEdit && (
        <EditPerformanceModal 
          performance={performanceToEdit}
          portfolioId={portfolioId}
          onClose={() => setPerformanceToEdit(null)}
          onSuccess={fetchAnnualPerformances}
        />
      )}

      {/* Delete Performance Modal */}
      {performanceToDelete && (
        <DeletePerformanceModal 
          performance={performanceToDelete}
          portfolioId={portfolioId}
          onClose={() => setPerformanceToDelete(null)}
          onSuccess={fetchAnnualPerformances}
        />
      )}

      {/* Add Cash Deposit Modal */}
      {showAddCashModal && (
        <AddCashDepositModal 
          portfolioId={portfolioId}
          onClose={() => setShowAddCashModal(false)}
          onSuccess={() => {
            fetchTransactions();
            fetchPortfolio();
          }}
        />
      )}
    </div>
  );
}

// Componente Modal per aggiungere asset
function AddAssetModal({ portfolioId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    isin: '',
    justETFUrl: '',
    targetAllocation: 0,
    currentPrice: 0,
    averagePurchasePrice: 0,
    quantity: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          portfolioId,
          targetAllocation: formData.targetAllocation / 100, // Converti da percentuale
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nella creazione dell\'asset');
      }
    } catch (error) {
      setError('Errore nella creazione dell\'asset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="responsive-modal">
      <div className="responsive-modal-content max-w-2xl">
        <h3 className="heading-md mb-4">Aggiungi Nuovo Asset</h3>
        
        <form onSubmit={handleSubmit} className="layout-compact">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="responsive-form-grid">
            <div>
              <label className="heading-sm mb-2">Nome Asset</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-professional"
                placeholder="iShares Core MSCI World UCITS ETF"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Simbolo</label>
              <input
                type="text"
                required
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                className="input-professional"
                placeholder="SWDA"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">ISIN</label>
              <input
                type="text"
                value={formData.isin}
                onChange={(e) => setFormData(prev => ({ ...prev, isin: e.target.value }))}
                className="input-professional"
                placeholder="IE00B4L5Y983"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Target Allocation (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={formData.targetAllocation}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAllocation: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="20"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Prezzo Attuale (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.currentPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="107.08"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Prezzo Medio Acquisto (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.averagePurchasePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, averagePurchasePrice: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="102.50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Il prezzo medio a cui hai acquistato questo asset
              </p>
            </div>
            
            <div>
              <label className="heading-sm mb-2">Quantità</label>
              <input
                type="number"
                min="0"
                required
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="226"
              />
            </div>
          </div>
          
          <div>
            <label className="heading-sm mb-2">URL justETF (opzionale)</label>
            <input
              type="url"
              value={formData.justETFUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, justETFUrl: e.target.value }))}
              className="input-professional"
              placeholder="https://www.justetf.com/it/etf-profile.html?isin=IE00B4L5Y983"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Aggiunta...' : 'Aggiungi Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal per cancellare asset
function DeleteAssetModal({ asset, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nella cancellazione dell\'asset');
      }
    } catch (error) {
      setError('Errore nella cancellazione dell\'asset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="responsive-modal">
      <div className="responsive-modal-content max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div>
            <h3 className="heading-md">Cancella Asset</h3>
            <p className="text-sm text-gray-500">Questa azione non può essere annullata</p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <p className="text-gray-700">
            Sei sicuro di voler cancellare l'asset <strong>{asset.symbol}</strong> ({asset.name}) dal portfolio?
          </p>
          <div className="mt-2 text-sm text-gray-500">
            <p>Valore attuale: {formatCurrency(asset.currentValue)}</p>
            <p>Quantità: {asset.quantity}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50"
          >
            {isLoading ? 'Cancellazione...' : 'Cancella Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Modal per modificare asset
function EditAssetModal({ asset, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: asset.name || '',
    symbol: asset.symbol || '',
    isin: asset.isin || '',
    justETFUrl: asset.justETFUrl || '',
    targetAllocation: (asset.targetAllocation * 100) || 0, // Converti da decimale a percentuale
    currentPrice: asset.currentPrice || 0,
    averagePurchasePrice: asset.averagePurchasePrice || 0,
    quantity: asset.quantity || 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          targetAllocation: formData.targetAllocation / 100, // Converti da percentuale a decimale
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nella modifica dell\'asset');
      }
    } catch (error) {
      setError('Errore nella modifica dell\'asset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="responsive-modal">
      <div className="responsive-modal-content max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="heading-md">Modifica Asset</h3>
            <p className="text-sm text-gray-500">Aggiorna i dati dell'asset nel portfolio</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="layout-compact">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="responsive-form-grid">
            <div>
              <label className="heading-sm mb-2">Nome Asset</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-professional"
                placeholder="iShares Core MSCI World UCITS ETF"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Simbolo</label>
              <input
                type="text"
                required
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                className="input-professional"
                placeholder="SWDA"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">ISIN</label>
              <input
                type="text"
                value={formData.isin}
                onChange={(e) => setFormData(prev => ({ ...prev, isin: e.target.value }))}
                className="input-professional"
                placeholder="IE00B4L5Y983"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Target Allocation (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={formData.targetAllocation}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAllocation: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="20"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Prezzo Attuale (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.currentPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="107.08"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Prezzo Medio Acquisto (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.averagePurchasePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, averagePurchasePrice: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="102.50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Il prezzo medio a cui hai acquistato questo asset
              </p>
            </div>
            
            <div>
              <label className="heading-sm mb-2">Quantità</label>
              <input
                type="number"
                min="0"
                required
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="226"
              />
            </div>
          </div>
          
          <div>
            <label className="heading-sm mb-2">URL justETF (opzionale)</label>
            <input
              type="url"
              value={formData.justETFUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, justETFUrl: e.target.value }))}
              className="input-professional"
              placeholder="https://www.justetf.com/it/etf-profile.html?isin=IE00B4L5Y983"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-secondary disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// Componente Modal per aggiungere performance annuale
function AddPerformanceModal({ portfolioId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear() - 1,
    totalProfit: 0,
    totalLoss: 0,
    portfolioValue: 0,
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/performance`, {
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
        setError(data.error || 'Errore nella creazione della performance');
      }
    } catch (error) {
      setError('Errore nella creazione della performance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="responsive-modal">
      <div className="responsive-modal-content max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="heading-md">Aggiungi Performance Annuale</h3>
            <p className="text-sm text-gray-500">Inserisci i dati di performance per un anno specifico</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="layout-compact">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="responsive-form-grid">
            <div>
              <label className="heading-sm mb-2">Anno</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                required
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                className="input-professional"
                placeholder={new Date().getFullYear() - 1}
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Profitto Totale (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.totalProfit}
                onChange={(e) => setFormData(prev => ({ ...prev, totalProfit: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Perdita Totale (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.totalLoss}
                onChange={(e) => setFormData(prev => ({ ...prev, totalLoss: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Valore Portfolio (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.portfolioValue}
                onChange={(e) => setFormData(prev => ({ ...prev, portfolioValue: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valore totale del portfolio alla fine dell'anno
              </p>
            </div>
          </div>
          
          <div>
            <label className="heading-sm mb-2">Note (opzionale)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input-professional"
              rows={3}
              placeholder="Note o commenti sulla performance dell'anno..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Aggiunta...' : 'Aggiungi Performance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal per modificare performance annuale
function EditPerformanceModal({ performance, portfolioId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    year: performance.year,
    totalProfit: performance.totalProfit,
    totalLoss: performance.totalLoss,
    portfolioValue: performance.portfolioValue,
    notes: performance.notes || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/performance/${performance.id}`, {
        method: 'PUT',
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
        setError(data.error || 'Errore nell\'aggiornamento della performance');
      }
    } catch (error) {
      setError('Errore nell\'aggiornamento della performance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="responsive-modal">
      <div className="responsive-modal-content max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="heading-md">Modifica Performance {performance.year}</h3>
            <p className="text-sm text-gray-500">Aggiorna i dati di performance per l'anno selezionato</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="layout-compact">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="responsive-form-grid">
            <div>
              <label className="heading-sm mb-2">Anno</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                required
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                className="input-professional"
                placeholder={new Date().getFullYear() - 1}
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Profitto Totale (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.totalProfit}
                onChange={(e) => setFormData(prev => ({ ...prev, totalProfit: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Perdita Totale (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.totalLoss}
                onChange={(e) => setFormData(prev => ({ ...prev, totalLoss: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="heading-sm mb-2">Valore Portfolio (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.portfolioValue}
                onChange={(e) => setFormData(prev => ({ ...prev, portfolioValue: parseFloat(e.target.value) || 0 }))}
                className="input-professional"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valore totale del portfolio alla fine dell'anno
              </p>
            </div>
          </div>
          
          <div>
            <label className="heading-sm mb-2">Note (opzionale)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input-professional"
              rows={3}
              placeholder="Note o commenti sulla performance dell'anno..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-secondary disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal per eliminare performance annuale
function DeletePerformanceModal({ performance, portfolioId, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/performance/${performance.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nell\'eliminazione della performance');
      }
    } catch (error) {
      setError('Errore nell\'eliminazione della performance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="responsive-modal">
      <div className="responsive-modal-content max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div>
            <h3 className="heading-md">Elimina Performance</h3>
            <p className="text-sm text-gray-500">Questa azione non può essere annullata</p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <p className="text-gray-700">
            Sei sicuro di voler eliminare la performance dell'anno <strong>{performance.year}</strong>?
          </p>
          <div className="mt-2 text-sm text-gray-500">
            <p>P&L Netto: {formatCurrency(performance.netProfitLoss)}</p>
            <p>Rendimento: {formatPercentage(performance.returnPercentage / 100, { showSign: true })}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50"
          >
            {isLoading ? 'Eliminazione...' : 'Elimina Performance'}
          </button>
        </div>
      </div>
    </div>
  );
}


// Componente Modal per aggiungere apporto di liquidità manuale
function AddCashDepositModal({ portfolioId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: 0,
    executedAt: new Date().toISOString().slice(0, 16), // formato datetime-local
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (formData.amount <= 0) {
        throw new Error("L'importo deve essere maggiore di zero");
      }

      const response = await fetch(`/api/portfolios/${portfolioId}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CASH_DEPOSIT",
          amount: formData.amount,
          executedAt: formData.executedAt,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Errore nella registrazione dell'apporto");
      }
    } catch (error) {
      setError(error.message || "Errore nella registrazione dell'apporto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="responsive-modal">
      <div className="responsive-modal-content max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="heading-md">Registra Apporto Liquidità</h3>
            <p className="text-sm text-gray-500">Aggiungi un versamento manuale al portfolio</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="layout-compact">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="heading-sm mb-2">Importo (€)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              className="input-professional"
              placeholder="1000.00"
            />
          </div>
          
          <div>
            <label className="heading-sm mb-2">Data e Ora</label>
            <input
              type="datetime-local"
              required
              value={formData.executedAt}
              onChange={(e) => setFormData(prev => ({ ...prev, executedAt: e.target.value }))}
              className="input-professional"
            />
          </div>
          
          <div>
            <label className="heading-sm mb-2">Note (opzionale)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input-professional"
              rows={3}
              placeholder="Bonifico del 15/03/2024, stipendio marzo, ecc..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-secondary disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? "Registrazione..." : "Registra Apporto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
