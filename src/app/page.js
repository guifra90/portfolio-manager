// src/app/page.js
import Link from 'next/link';
import { Briefcase, TrendingUp, Shield, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Portfolio Manager</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Accedi
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Registrati
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Gestisci il tuo{' '}
            <span className="text-blue-600">Portafoglio ETF</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Piattaforma completa per il monitoraggio, l'analisi e il ribilanciamento 
            del tuo portafoglio di investimenti. Semplice, potente e sicura.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
            >
              Inizia Gratis
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
            >
              Accedi
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Monitoraggio Real-time
            </h3>
            <p className="text-gray-600">
              Tieni traccia delle performance del tuo portafoglio con grafici 
              e metriche aggiornate in tempo reale.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ribilanciamento Automatico
            </h3>
            <p className="text-gray-600">
              Calcola automaticamente le operazioni necessarie per mantenere 
              l'allocazione target del tuo portafoglio.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Multi-Portfolio
            </h3>
            <p className="text-gray-600">
              Gestisci diversi portafogli simultaneamente con account 
              personali sicuri e isolati.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-blue-600 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto a ottimizzare i tuoi investimenti?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Unisciti a migliaia di investitori che già utilizzano Portfolio Manager 
            per gestire i loro ETF in modo professionale.
          </p>
          <Link
            href="/auth/register"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium text-lg transition-colors inline-block"
          >
            Crea Account Gratuito
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Briefcase className="h-6 w-6" />
              <span className="text-lg font-semibold">Portfolio Manager</span>
            </div>
            <div className="text-gray-400">
              © 2025 Portfolio Manager. Tutti i diritti riservati.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}