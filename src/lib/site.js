
export const SITE = {
  name:
    process.env.NEXT_PUBLIC_STORE_NAME ||
    'FASHIONZ EMPIRE',

  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://fashionzempire.vercel.app'
  ).replace(/\/$/, ''),

  description:
    "Shop stylish women's three-piece collections, men's watches and ladies' watches at FASHIONZ EMPIRE Bangladesh. Discover fashionable designs and shop online.",

  currency: 'BDT',
};
