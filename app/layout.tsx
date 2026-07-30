import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistSans = localFont({
  src: [
    {
      path: './fonts/Geist/Geist-VariableFont_wght.ttf',
      style: 'normal',
      weight: '100 900',
    },
    {
      path: './fonts/Geist/Geist-Italic-VariableFont_wght.ttf',
      style: 'italic',
      weight: '100 900',
    },
  ],
  variable: '--font-geist-sans',
  display: 'swap',
})

const montserrat = localFont({
  src: [
    {
      path: './fonts/Montserrat/Montserrat-VariableFont_wght.ttf',
      style: 'normal',
      weight: '100 900',
    },
    {
      path: './fonts/Montserrat/Montserrat-Italic-VariableFont_wght.ttf',
      style: 'italic',
      weight: '100 900',
    },
  ],
  variable: '--font-montserrat',
  display: 'swap',
})

const alibabaPuHuiTi = localFont({
  src: [
    {
      path: './fonts/AlibabaPuHuiTi-3/AlibabaPuHuiTi-3-45-Light.woff2',
      style: 'normal',
      weight: '300',
    },
    {
      path: './fonts/AlibabaPuHuiTi-3/AlibabaPuHuiTi-3-55-Regular.woff2',
      style: 'normal',
      weight: '400',
    },
    {
      path: './fonts/AlibabaPuHuiTi-3/AlibabaPuHuiTi-3-115-Black.woff2',
      style: 'normal',
      weight: '900',
    },
  ],
  variable: '--font-alibaba-puhuiti',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'Speechaholic',
  description:
    'Plan meeting roles, sessions, speeches, and timing, then create a polished agenda for your Toastmasters meeting.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/toastmasters-logo.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/toastmasters-logo.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`bg-background ${geistSans.variable} ${montserrat.variable} ${alibabaPuHuiTi.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
