import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { I18nProvider } from '@/lib/i18n/context'
import { Navbar } from '@/components/layout/navbar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DiMaria Chop Bar',
  description: 'Order delicious Ghanaian food online',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#1f2937',
                color: '#fff',
                fontSize: '14px',
              },
            }}
          />
        </I18nProvider>
      </body>
    </html>
  )
}
