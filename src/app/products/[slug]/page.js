
import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site';
import { getProducts } from '@/lib/products';
import ProductView from '@/components/ProductView';
import ProductFallback from '@/components/ProductFallback';

export const revalidate = 120;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://fashionzempire.vercel.app'
).replace(/\/$/, '');

const BRAND_NAME = 'Fashionz Empire';

function productUrl(slug) {
  return `${SITE_URL}/products/${encodeURIComponent(slug)}`;
}

function productImages(product) {
  return Array.isArray(product.images)
    ? product.images.filter(
        (url) => typeof url === 'string' && url.trim()
      )
    : [];
}

function productDescription(product) {
  const fallback =
    `${product.productName} available at Fashionz Empire Bangladesh. ` +
    `Price: ৳${product.price}. Shop online.`;

  return String(product.description || fallback)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155);
}

export async function generateStaticParams() {
  const products = await getProducts();

  return products
    .filter((p) => p.slug)
    .map((p) => ({
      slug: String(p.slug),
    }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const products = await getProducts();
  const p = products.find((x) => x.slug === slug);

  if (!p) {
    return {
      title: 'Product',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = p.productName;
  const description = productDescription(p);
  const url = productUrl(p.slug);
  const images = productImages(p);

  return {
    title,
    description,

    alternates: {
      canonical: url,
    },

    openGraph: {
      type: 'website',
      title: `${title} | ${BRAND_NAME}`,
      description,
      url,
      siteName: BRAND_NAME,
      locale: 'en_BD',
      images: images.map((image) => ({
        url: image,
        alt: title,
      })),
    },

    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${BRAND_NAME}`,
      description,
      images,
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  const all = await getProducts();
  const p = all.find((x) => x.slug === slug);

  if (!p) {
    // Preserve existing fallback behavior
    if (all.length === 0) {
      return <ProductFallback slug={slug} />;
    }

    notFound();
  }

  const url = productUrl(p.slug);
  const images = productImages(p);
  const description = productDescription(p);

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',

      name: p.productName,
      description: p.description || description,
      image: images,
      url,

      ...(p.id
        ? { sku: String(p.id) }
        : {}),

      ...(p.category
        ? { category: p.category }
        : {}),

      brand: {
        '@type': 'Brand',
        name: BRAND_NAME,
      },

      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: SITE.currency || 'BDT',
        price: String(p.price),

        availability:
          p.status === 'Out of Stock'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',

        itemCondition:
          'https://schema.org/NewCondition',

        seller: {
          '@type': 'Organization',
          name: BRAND_NAME,
          url: SITE_URL,
        },
      },
    },

    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',

      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Shop',
          item: `${SITE_URL}/products`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: p.productName,
          item: url,
        },
      ],
    },
  ];

  return (
    <>
      <ProductView p={p} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ld).replace(
            /</g,
            '\\u003c'
          ),
        }}
      />
    </>
  );
}
