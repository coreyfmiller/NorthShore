import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'North Shore — Survival Game',
  description: 'A realistic survival game set in rural New Brunswick, Canada',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white overflow-hidden">
        {children}
      </body>
    </html>
  )
}
