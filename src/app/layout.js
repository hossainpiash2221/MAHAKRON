import './globals.css';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import { SITE } from '@/lib/site';
import { getProducts } from '@/lib/products';
import ProductsProvider from '@/components/ProductsProvider';
import CartProvider from '@/components/CartProvider';
import OrdersProvider from '@/components/OrdersProvider';
import Header from '@/components/Header';
import TopLoader from '@/components/TopLoader';
import Footer from '@/components/Footer';
import { ToastContainer, Bounce } from 'react-toastify';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Figtree({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const revalidate = 120;

// export const metadata = {
//   metadataBase: new URL(SITE.url),
//   title: { default: `${SITE.name} | Three-piece & fashion, delivered across Bangladesh`, template: `%s | ${SITE.name}` },
//   description: SITE.description,
//   openGraph: { type: 'website', siteName: SITE.name, title: SITE.name, description: SITE.description, url: SITE.url, locale: 'en_BD' },
//   twitter: { card: 'summary_large_image', title: SITE.name, description: SITE.description },
// };

export const metadata = {
  title: {
    default: 'ZUNIRAH | Fashion, Clothing & Accessories in Bangladesh',
    template: '%s | ZUNIRAH',
  },

  description:
    "Shop men's and women's fashion at ZUNIRAH Bangladesh. Explore sarees, three-piece sets, shirts, T-shirts, jackets, pants, watches, shoes, wallets, bracelets & more.",

  keywords: [
    'ZUNIRAH',
    'ZUNIRAH Bangladesh',
    'Online Shopping Bangladesh',
    'Online Fashion Store BD',
    'Men Fashion Bangladesh',
    'Women Fashion Bangladesh',
    'Saree Online Bangladesh',
    'Three Piece Collection BD',
    'T-Shirt Bangladesh',
    'Shirt Online BD',
    'Genji Bangladesh',
    'Jacket Bangladesh',
    'Pants Online BD',
    'Watches Bangladesh',
    'Shoes Online Bangladesh',
    'Wallet Bangladesh',
    'Bracelets Bangladesh',
    'Fashion Accessories BD',
    'Affordable Fashion Bangladesh',
  ],

   openGraph: {
    title: 'ZUNIRAH | Your Style, Your Statement',
    description:
      "Discover men's and women's fashion, clothing, footwear and accessories at ZUNIRAH Bangladesh.",
    siteName: 'ZUNIRAH',
    locale: 'en_BD',
    type: 'website',
    images: [
      {
        url: '/logoFooter.webp',
        width: 1200,
        height: 630,
        alt: 'ZUNIRAH Fashion & Lifestyle Collection',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'ZUNIRAH | Fashion & Lifestyle',
    description: 'Explore fashion, clothing and accessories at ZUNIRAH.',
    images: ['/logoFooter.webp'],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: '/favIcon.webp',
    shortcut: '/favIcon.webp',
    apple: '/favIcon.webp',
  },
};

export const viewport = { themeColor: '#0F5C6B' };

export default async function RootLayout({ children }) {
  // Served from Next's 2-minute cache, so this normally costs nothing. Only the first request after a cold start waits on Apps Script.
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
              <TopLoader />
              <Header />
              <main id="main"  className="bg-white bg-[url('/bg.webp')] bg-cover bg-center bg-fixed" >{children}
                <ToastContainer
                  position="bottom-right"
                  autoClose={2500}
                  newestOnTop
                  closeOnClick
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                  transition={Bounce}
                  toastClassName="rounded-lg border border-pink bg-pink text-sm font-medium text-white shadow-xl shadow-pink"
                  progressClassName="!bg-white"
                    />
              </main>
              <Footer />
            </OrdersProvider>
          </CartProvider>
        </ProductsProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      </body>
    </html>
  );
}
