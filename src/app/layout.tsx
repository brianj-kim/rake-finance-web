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
      <body className={`${inter.className} antialiased`}>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}

export default RootLayout;