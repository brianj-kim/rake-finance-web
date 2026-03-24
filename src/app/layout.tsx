import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { Toaster } from '@/components/ui/sonner';

const RootLayout = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <main className="min-h-screen">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}

export default RootLayout;
