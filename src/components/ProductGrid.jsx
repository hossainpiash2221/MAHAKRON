// import ProductCard from "./ProductCard";
// export default function ProductGrid({ products, priorityCount = 4 }) {
//   return (
//     <ul className="grid grid-cols-2 gap-x-1 md:gap-x-2 gap-y-4 md:grid-cols-3 min-[1340px]:grid-cols-4 min-[1400px]:grid-cols-5 min-[1760px]:grid-cols-6">
//       {products.map((p, i) => (
//         <ProductCard key={p.id} p={p} priority={i < priorityCount} />
//       ))}
//     </ul>
//   );
// }
// export function GridSkeleton({ n = 8 }) {
//   return (
//     <ul
//       className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4"
//       aria-busy="true"
//       aria-label="Loading products"
//     >
//       {Array.from({ length: n }, (_, i) => (
//         <li key={i}>
//           <div className="aspect-[4/5] animate-pulse rounded bg-mist" />
//           <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-mist" />
//           <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-mist" />
//         </li>
//       ))}
//     </ul>
//   );
// }

import ProductCard from "./ProductCard";

export default function ProductGrid({
  products = [],
  gender = "all",
  priorityCount = 4,
}) {
  const filteredProducts = products.filter((p) => {
    if (gender === "all") return true;

    return (
      p.gender?.toLowerCase() === gender.toLowerCase()
    );
  });

  return (
    <ul className="grid grid-cols-2 gap-x-1 md:gap-x-2 gap-y-4 md:grid-cols-3 min-[1340px]:grid-cols-4 min-[1400px]:grid-cols-5 min-[1760px]:grid-cols-6">
      {filteredProducts.map((p, i) => (
        <ProductCard
          key={p.id}
          p={p}
          priority={i < priorityCount}
        />
      ))}
    </ul>
  );
}

export function GridSkeleton({ n = 8 }) {
  return (
    <ul
      className="grid grid-cols-2 gap-x-1 md:gap-x-2 gap-y-4 md:grid-cols-3 min-[1340px]:grid-cols-4 min-[1400px]:grid-cols-5 min-[1760px]:grid-cols-6"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: n }, (_, i) => (
        <li key={i}>
          <div className="aspect-[4/5] animate-pulse rounded bg-mist" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-mist" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-mist" />
        </li>
      ))}
    </ul>
  );
}