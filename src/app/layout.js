
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

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const revalidate = 120;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://fashionzempire.vercel.app'
).replace(/\/$/, '');

const OG_IMAGE =
  'https://res.cloudinary.com/jedeqejq/image/upload/v1794673470/opengraph.png';

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:
      'Fashionz Empire | Three-Piece & Premium Watches in Bangladesh',
    template: '%s | Fashionz Empire',
  },

  description:
    "Shop stylish women's three-piece collections, premium men's watches and ladies' watches at Fashionz Empire Bangladesh. Explore fashionable designs online.",

  applicationName: 'Fashionz Empire',

  keywords: [
    'Fashionz Empire',
    'Fashionz Empire Bangladesh',
    'Fashionz Empire BD',
    'Three Piece Bangladesh',
    'Three Piece Collection BD',
    'Three Piece Online Shopping',
    'Ladies Three Piece Bangladesh',
    'Women Fashion Bangladesh',
    'Mens Watch Bangladesh',
    'Ladies Watch Bangladesh',
    'Premium Watches BD',
    'Watches Online Bangladesh',
    'Fashion Accessories Bangladesh',
    'Online Shopping Bangladesh',
  ],

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'Fashionz Empire | Elevate Your Everyday Style',
    description:
      "Discover stylish three-piece collections, men's watches and ladies' watches at Fashionz Empire Bangladesh.",
    url: SITE_URL,
    siteName: 'Fashionz Empire',
    locale: 'en_BD',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Fashionz Empire - Three-Piece & Premium Watches',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Fashionz Empire | Fashion & Premium Watches',
    description:
      "Shop stylish three-piece collections and premium men's and women's watches at Fashionz Empire Bangladesh.",
    images: [OG_IMAGE],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  icons: {
    icon: '/favIcon.webp',
    shortcut: '/favIcon.webp',
    apple: '/favIcon.webp',
  },
};

export const viewport = {
  themeColor: '#0F5C6B',
};

export default async function RootLayout({ children }) {
  const products = await getProducts();

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: SITE.name,
        url: SITE_URL,
      },
      {
        '@type': 'WebSite',
        name: SITE.name,
        url: SITE_URL,
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} bg-white text-white`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
        >
          Skip to content
        </a>

        <ProductsProvider initial={products}>
          <CartProvider>
            <OrdersProvider>
              <DeliveryPrefetch />

              <TopLoader />

              <Header />

              <main
                id="main"
                className="bg-white bg-[url('/bg.webp')] bg-cover bg-center bg-fixed pb-20 lg:pb-0"
              >
                {children}

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

              <Suspense fallback={null}>
                <ConditionalMobileBottomNav />
              </Suspense>
            </OrdersProvider>
          </CartProvider>
        </ProductsProvider>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ld).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
