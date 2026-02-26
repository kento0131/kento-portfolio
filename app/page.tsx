import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { loadPhotosFromDir } from "@/lib/photos";

export const dynamic = "force-dynamic";

export default async function Home() {
  const categoriesWithThumb = await Promise.all(
    CATEGORIES.map(async (cat) => {
      const photos = await loadPhotosFromDir(cat.dir);
      const thumb =
        photos.length > 0
          ? photos[Math.floor(Math.random() * photos.length)]
          : null;
      return { ...cat, thumb, count: photos.length };
    })
  );

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
      <header className="py-20 text-center">
        <h1 className="text-4xl font-thin tracking-[0.3em] uppercase text-[#222]">
          Portfolio
        </h1>
        <p className="mt-3 text-sm tracking-widest text-[#aaa] uppercase">
          Photography by Kento
        </p>
      </header>

      <section className="max-w-4xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {categoriesWithThumb.map((cat) => (
            <Link key={cat.slug} href={`/c/${cat.slug}`} className="group block">
              <div className="relative overflow-hidden rounded-sm bg-[#ebebeb] aspect-[3/2]">
                {cat.thumb ? (
                  <Image
                    src={cat.thumb.src}
                    alt={cat.label}
                    fill
                    quality={75}
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#bbb] text-xs tracking-widest uppercase">
                    No photos yet
                  </div>
                )}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/40 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white text-lg font-thin tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {cat.label}
                  </p>
                  <p className="text-white/60 text-xs tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {cat.count} {cat.count === 1 ? "photo" : "photos"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs tracking-[0.2em] uppercase text-[#888]">
                {cat.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="text-center pb-10 text-[#bbb] text-xs tracking-widest uppercase">
        © 2025 Kento
      </footer>
    </main>
  );
}
