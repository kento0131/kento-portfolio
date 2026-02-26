import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { loadPhotosFromDir } from "@/lib/photos";
import Lightbox from "@/app/Lightbox";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const photos = await loadPhotosFromDir(category.dir);

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-white">
      <header className="py-16 text-center relative">
        <Link
          href="/"
          className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs tracking-widest uppercase transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-4xl font-thin tracking-[0.3em] uppercase text-white/90">
          {category.label}
        </h1>
        <p className="mt-3 text-sm tracking-widest text-white/40 uppercase">
          Photography by Kento
        </p>
      </header>

      {photos.length > 0 ? (
        <Lightbox photos={photos} />
      ) : (
        <div className="text-center py-20 text-white/20 text-sm tracking-widest uppercase">
          No photos in this category yet
        </div>
      )}

      <footer className="text-center pb-10 text-white/20 text-xs tracking-widest uppercase">
        © 2025 Kento
      </footer>
    </main>
  );
}
