import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Portfolio Manager - Gestione ETF con Ruoli',
  description: 'Piattaforma professionale per la gestione e il ribilanciamento del portafoglio ETF con sistema multi-utente e ruoli admin',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}