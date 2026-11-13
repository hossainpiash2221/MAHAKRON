
export const SITE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'FASHIONZ EMPIRE',

  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, ''),

  description:
    "Shop men's and women's fashion, stylish watches, clothing, sarees, three-piece collections, shoes and accessories at FASHIONZ EMPIRE. Discover quality products at affordable prices with cash on delivery across Bangladesh.",

  currency: 'BDT',
};
