// src/app/dashboard/portfolio/[id]/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, RefreshCw, Plus, Minus, Calculator, ExternalLink, Edit, Trash2 } from 'lucide-react';

export default function PortfolioDetailPage() {
  const params = useParams();
  const portfolioId = params.id;
  
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRebalancing, setShowRebalancing] = useState(false);
  const [rebalancingMode, setRebalancingMode] = useState('sale');
  const [newLiquidity, setNewLiquidity] = useState(0);
  const [showAddAsset, setShowAddAsset] = useState(false);

  useEffect(() => {
    fetchPortfolio();
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

  // Calcoli del portfolio
  const portfolioMetrics = useMemo(() => {
    if (!portfolio?.assets) return { totalValue: 0, totalProfit: 0, returnPercentage: 0 };
    
    const totalValue = portfolio.assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalProfit = portfolio.assets.reduce((sum, asset) => sum + asset.profitLoss, 0);
    const returnPercentage = totalValue > 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;
    
    return { totalValue, totalProfit, returnPercentage };
  }, [portfolio]);

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

      return {
        ...asset,
        targetValue,
        difference,
        quantityDelta: Math.round(quantityDelta * 100) / 100,
        newQuantity: Math.round(newQuantity),
        action: difference > 0 ? 'ACQUISTA' : 'VENDI',
        operationAmount: Math.abs(difference)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{portfolio.name}</h1>
            <p className="text-gray-600 mt-1">{portfolio.description}</p>
          </div>
          <button
            onClick={() => setShowAddAsset(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Aggiungi Asset
          </button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche Portfolio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Valore Portfolio</p>
            <p className="text-2xl font-bold text-gray-900">€{portfolioMetrics.totalValue.toLocaleString()}</p>
          </div>

          <div className="text-center">
            {portfolioMetrics.totalProfit >= 0 ? 
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" /> : 
              <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
            }
            <p className="text-sm font-medium text-gray-600">Profitto/Perdita</p>
            <p className={`text-2xl font-bold ${portfolioMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{portfolioMetrics.totalProfit.toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Rendimento</p>
            <p className={`text-2xl font-bold ${portfolioMetrics.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioMetrics.returnPercentage.toFixed(2)}%
            </p>
          </div>

          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Asset</p>
            <p className="text-2xl font-bold text-gray-900">{portfolio.assets.length}</p>
          </div>
        </div>
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafico a torta */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocazione Portfolio</h3>
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
              <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Grafico a barre */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocazione vs Target</h3>
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
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Dettaglio Asset</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prezzo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantità</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocazione</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sbilanciamento</th>
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
                    €{asset.currentPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    €{asset.currentValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={asset.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                      €{asset.profitLoss.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(asset.currentAllocation * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(asset.targetAllocation * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      Math.abs(asset.imbalance) > 0.01 
                        ? asset.imbalance > 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {asset.imbalance > 0 ? '+' : ''}{(asset.imbalance * 100).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sezione Ribilanciamento */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Calcolatore Ribilanciamento</h3>
          <Calculator className="h-6 w-6 text-blue-600" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modalità Ribilanciamento
            </label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newLiquidity}
                onChange={(e) => setNewLiquidity(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          )}

          <div>
            <button
              onClick={() => setShowRebalancing(!showRebalancing)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {showRebalancing ? 'Nascondi' : 'Calcola'} Ribilanciamento
            </button>
          </div>
        </div>

        {/* Risultati Ribilanciamento */}
        {showRebalancing && rebalancingCalculations.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Operazioni Necessarie 
              {rebalancingMode === 'liquidity' && newLiquidity > 0 && 
                ` (con €${newLiquidity.toLocaleString()} di nuova liquidità)`
              }
            </h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azione</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantità</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nuova Quantità</th>
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${
                          asset.action === 'ACQUISTA' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {asset.action === 'ACQUISTA' ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          {asset.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.abs(asset.quantityDelta)} quote
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{asset.operationAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.newQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{asset.targetValue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aggiungi Nuovo Asset</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Asset</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="iShares Core MSCI World UCITS ETF"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Simbolo</label>
              <input
                type="text"
                required
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SWDA"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISIN</label>
              <input
                type="text"
                value={formData.isin}
                onChange={(e) => setFormData(prev => ({ ...prev, isin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="IE00B4L5Y983"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Allocation (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={formData.targetAllocation}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAllocation: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo Attuale (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.currentPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="107.08"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantità</label>
              <input
                type="number"
                min="0"
                required
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="226"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL justETF (opzionale)</label>
            <input
              type="url"
              value={formData.justETFUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, justETFUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.justetf.com/it/etf-profile.html?isin=IE00B4L5Y983"
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
              {isLoading ? 'Aggiunta...' : 'Aggiungi Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}