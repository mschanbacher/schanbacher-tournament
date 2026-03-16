import './globals.css'

export const metadata = {
  title: 'Schanbacher Tournament Challenge',
  description: 'Family March Madness bracket competition since 2003',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
