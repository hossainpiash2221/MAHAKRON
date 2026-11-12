import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';
import GenderTiles from '@/components/GenderTiles';
import CategoryRow from '@/components/CategoryRow';
import HeroProductSlider from '@/components/HeroProductSlider';
import GenderProductSlider from '@/components/GenderProductSlider';
import MahakronBentoProducts from "@/components/MahakronBentoProducts";

export const metadata = { alternates: { canonical: '/' } };

const steps = [
  ['পণ্য বেছে নিন', 'আপনার পছন্দের পণ্য, রং ও সাইজ নির্বাচন করুন।'],
  ['অর্ডার করুন', 'আপনার নাম, মোবাইল নম্বর ও ঠিকানা দিন। অ্যাকাউন্ট খোলার প্রয়োজন নেই।'],
  ['পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন', 'আমরা আপনার ঠিকানায় পণ্য পৌঁছে দেব। পণ্য হাতে পেয়ে নগদ টাকা পরিশোধ করুন।'],
];

export default function Home() {
  return (
    <>
      <Hero />
      {/* <GenderTiles /> */}
      
      <CategoryRow></CategoryRow>
      <FeaturedProducts />
         {/* <HeroProductSlider category="Batik" /> */}
         <GenderProductSlider gender="male" />
         

  <section
  className="mx-auto max-w-6xl px-4 pt-20 pb-20"
  aria-labelledby="how"
>
  <h2
    id="how"
    className="font-display text-3xl font-bold tracking-tight uppercase"
  >
    যেভাবে অর্ডার করবেন
  </h2>

  <ol className="mt-8 grid gap-6 sm:grid-cols-3">
    {steps.map(([t, d], i) => (
      <li key={t} className="border-t-2 border-peacock pt-4">
        <p className="font-display text-sm font-bold text-peacock">
          ধাপ {i + 1}
        </p>
        <p className="mt-1 text-lg font-semibold">{t}</p>
        <p className="mt-1 text-ink/75">{d}</p>
      </li>
    ))}
  </ol>
</section>
    </>
  );
}
