
import './globals.css';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import { SITE } from '@/lib/site';
import { getProducts } from '@/lib/products';
import ProductsProvider from '@/components/ProductsProvider';
import CartProvider from '@/components/CartProvider';
import OrdersProvider from '@/components/OrdersProvider';
import DeliveryPrefetch from '@/components/DeliveryPrefetch';
import Header from '@/components/Header';
import TopLoader from '@/components/TopLoader';
import Footer from '@/components/Footer';
import ConditionalMobileBottomNav from '@/components/ConditionalMobileBottomNav';
import { Suspense } from 'react';
import { ToastContainer, Bounce } from 'react-toastify';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Figtree({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const revalidate = 120;
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'FASHIONZ EMPIRE | Fashion, Clothing & Accessories in Bangladesh',
    template: '%s | FASHIONZ EMPIRE',
  },
  description: "Discover men's and women's fashion, clothing, watches, shoes and accessories at FASHIONZ EMPIRE Bangladesh.",
  keywords: [
    'FASHIONZ EMPIRE', 'FASHIONZ EMPIRE Bangladesh', 'Online Shopping Bangladesh',
    'Online Fashion Store BD', 'Men Fashion Bangladesh', 'Women Fashion Bangladesh',
    'Saree Online Bangladesh', 'Three Piece Collection BD', 'T-Shirt Bangladesh',
    'Shirt Online BD', 'Jacket Bangladesh', 'Pants Online BD',
    'Watches Bangladesh', 'Shoes Online Bangladesh', 'Wallet Bangladesh',
    'Fashion Accessories BD',
  ],
  openGraph: {
    title: 'FASHIONZ EMPIRE | Your Style, Your Statement',
    description: "Discover men's and women's fashion, watches, clothing and accessories at FASHIONZ EMPIRE Bangladesh.",
    siteName: 'FASHIONZ EMPIRE', locale: 'en_BD', type: 'website',
    images: [{ url: '/mahakron-white.webp', width: 1200, height: 630, alt: 'FASHIONZ EMPIRE Fashion & Lifestyle Collection' }],
  },
  twitter: {
    card: 'summary_large_image', title: 'FASHIONZ EMPIRE | Fashion & Lifestyle',
    description: 'Explore fashion, watches, clothing and accessories at FASHIONZ EMPIRE.',
    images: ['/mahakron-white.webp'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favIcon.webp', shortcut: '/favIcon.webp', apple: '/favIcon.webp' },
};
export const viewport = { themeColor: '#0F5C6B' };

export default async function RootLayout({ children }) {
  const products = await getProducts();
  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', name: SITE.name, url: SITE.url },
      { '@type': 'WebSite', name: SITE.name, url: SITE.url },
    ],
  };
  return (
    <html lang="en" className={`${display.variable} ${body.variable} bg-white text-white`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
        <ProductsProvider initial={products}>
          <CartProvider>
            <OrdersProvider>
              <DeliveryPrefetch />
              <TopLoader />
              <Header />
              <main id="main" className="bg-white bg-[url('/bg.webp')] bg-cover bg-center bg-fixed pb-20 lg:pb-0">
                {children}
                <ToastContainer
                  position="bottom-right" autoClose={2500} newestOnTop closeOnClick
                  pauseOnFocusLoss draggable pauseOnHover theme="light" transition={Bounce}
                  toastClassName="rounded-lg border border-pink bg-pink text-sm font-medium text-white shadow-xl shadow-pink"
                  progressClassName="!bg-white"
                />
              </main>
              <Footer />
              <Suspense fallback={null}>
                <ConditionalMobileBottomNav />
              </Suspense>
            </OrdersProvider>
          </CartProvider>
        </ProductsProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      </body>
    </html>
  );
}
