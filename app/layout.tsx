import '../styles/globals.css'

export const metadata = {
  title: 'Whopify',
  description: 'Shopify integration for Whop experiences',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
