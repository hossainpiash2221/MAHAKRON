
import Link from "next/link";
import Image from "next/image";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaPhoneAlt,
} from "react-icons/fa";
import {
  MdEmail,
  MdLocationOn,
} from "react-icons/md";
import { FiArrowUpRight } from "react-icons/fi";

// তোমার actual information এখানে বসাবে
const CONTACT = {
  phone: "+8801XXXXXXXXX",
  email: "zunirah@gmail.com",
  location: "United Garder block-A, ECB Chottor, Dhaka Cantt, Dhaka-1206",

  facebook: "https://www.facebook.com/zunirah02",
  instagram: "https://www.instagram.com/p/DeZW9VpGBog/?cplk=NDJsMWQ2cmFhajhy",
  tiktok: "https://vt.tiktok.com/ZSgJxd6Vy/",
};

// তোমার website-এর actual route অনুযায়ী পরিবর্তন করবে
const footerLinks = [
  {
    title: "Shop",
    links: [
      { name: "All Products", href: "/products" },
      { name: "Women", href: "/products?gender=Female" },
      { name: "Men", href: "/products?gender=Male" },
      { name: "My Cart", href: "/cart" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { name: "My Orders", href: "/orders" },
      { name: "Contact Us", href: "/contact" },
      { name: "Shipping Policy", href: "/shipping-policy" },
      { name: "Return & Refund", href: "/return-policy" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Our Collection", href: "/products" },
      { name: "Home", href: "/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms & Conditions", href: "/terms" },
    ],
  },
];

const socialLinks = [
  {
    name: "Facebook",
    icon: FaFacebookF,
    href: CONTACT.facebook,
  },
  {
    name: "Instagram",
    icon: FaInstagram,
    href: CONTACT.instagram,
  },
  {
    name: "TikTok",
    icon: FaTiktok,
    href: CONTACT.tiktok,
  },
];

export default function Footer() {
  return (
    <footer className="bg-[url('/bg-leaff.webp')] bg-cover bg-center bg-fixed text-white">
      <div className="mx-auto max-w-[1660px] px-5 pt-14 sm:px-8 lg:px-10 lg:pt-20">

        {/* MAIN FOOTER */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 border-b border-white/15 pb-14 md:grid-cols-3 lg:grid-cols-6 lg:gap-8 lg:pb-20">

          {/* BRAND & CONTACT */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 lg:pr-10">

            <Link
              href="/"
              className="inline-block text-3xl font-semibold tracking-[0.12em] sm:text-4xl"
            >
              <img src="/footer-logo.webp" alt="Zunirah" />
            </Link>

            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.35em] text-white/60">
              Fashion For Every You
            </p>

            <p className="mt-7 max-w-[330px] text-sm leading-7 text-white/65">
              Discover timeless fashion, effortless elegance
              and everyday comfort. Find your perfect style
              with ZUNIRAH.
            </p>

            {/* CONTACT DETAILS */}
            <div className="mt-8 space-y-4">

              {/* <a
                href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 text-sm text-white/75 transition-colors hover:text-white"
              >
                <FaPhoneAlt className="shrink-0 text-[13px]" />
                <span>{CONTACT.phone}</span>
              </a> */}

              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-3 text-sm text-white/75 transition-colors hover:text-white"
              >
                <MdEmail className="shrink-0 text-lg" />
                <span>{CONTACT.email}</span>
              </a>

              <div className="flex items-center gap-3 text-sm text-white/75">
                <MdLocationOn className="shrink-0 text-lg" />
                <span>{CONTACT.location}</span>
              </div>

            </div>

            {/* SOCIAL ICONS */}
            <div className="mt-8 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.name}
                    href={social.href || "#"}
                    target={social.href ? "_blank" : undefined}
                    rel={social.href ? "noopener noreferrer" : undefined}
                    aria-label={social.name}
                    onClick={undefined}
                    className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-white/20 text-white transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#00350c]"
                  >
                    <Icon size={17} />
                  </a>
                );
              })}
            </div>

          </div>

          {/* FOOTER LINK COLUMNS */}
          {footerLinks.map((section) => (
            <nav key={section.title} className="min-w-0">
              <h3 className="mb-6 text-[15px] font-semibold tracking-wide text-white">
                {section.title}
              </h3>

              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.name}`}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-[13px] leading-6 text-white/65 transition-colors duration-300 hover:text-white sm:text-sm"
                    >
                      <span>{link.name}</span>
                      <FiArrowUpRight
                        size={13}
                        className="opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

        </div>

        {/* COPYRIGHT */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-white/15 py-6 text-center sm:flex-row sm:text-left">

          <p className="text-xs text-white/55 sm:text-sm">
            © {new Date().getFullYear()} ZUNIRAH.
            All Rights Reserved.
          </p>

          <p className="text-xs text-white/55 sm:text-sm">
            Designed with love in Bangladesh
          </p>

        </div>

        {/* LARGE BOTTOM LOGO */}
        <div className="overflow-hidden py-8 sm:py-12">
          <Link
            href="/"
            aria-label="ZUNIRAH Home"
            className="block w-full"
          >
            <Image
              src="/logoFooter.webp"
              alt="ZUNIRAH Fashion"
              width={400}
              height={400}
              sizes="40vw"
              className="h-auto w-50% mx-auto object-contain"
              priority={false}
            />
          </Link>
        </div>

      </div>
    </footer>
  );
}
