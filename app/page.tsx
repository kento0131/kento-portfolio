import fs from "fs";
import path from "path";
import exifReader from "exif-reader";
import Lightbox, { PhotoData } from "./Lightbox";

export const dynamic = "force-dynamic";



function formatShutter(exp: number): string {
  if (exp >= 1) return `${exp}s`;
  return `1/${Math.round(1 / exp)}s`;
}

function readExifFromJpeg(filePath: string) {
  const buf = fs.readFileSync(filePath);
  let offset = 2;
  while (offset < buf.length - 4) {
    const marker = buf.readUInt16BE(offset);
    const segLen = buf.readUInt16BE(offset + 2);
    if (marker === 0xffe1) {
      const exifBuf = buf.slice(offset + 4, offset + 2 + segLen);
      return exifReader(exifBuf);
    }
    offset += 2 + segLen;
  }
  return null;
}

async function loadPhotos(): Promise<PhotoData[]> {
  const photosDir = path.join(process.cwd(), "public", "photos");
  const files = fs
    .readdirSync(photosDir)
    .filter((f) => /\.(jpe?g)$/i.test(f))
    .sort();

  const photos: PhotoData[] = [];
  for (const file of files) {
    const filePath = path.join(photosDir, file);
    let exif: PhotoData["exif"] = {};
    try {
      const data = readExifFromJpeg(filePath);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = data as any;
      const fnumber = d?.Photo?.FNumber;
      const iso = d?.Photo?.ISOSpeedRatings;
      const expTime = d?.Photo?.ExposureTime;
      const make = (d?.Image?.Make as string | undefined)?.replace("SONY", "Sony");
      const model = d?.Image?.Model as string | undefined;
      const lens = d?.Photo?.LensModel as string | undefined;
      exif = {
        camera: make && model ? `${make} ${model}` : model,
        lens: lens ?? undefined,
        aperture: fnumber ? `f/${fnumber}` : undefined,
        iso: iso ? String(iso) : undefined,
        shutter: expTime ? formatShutter(expTime) : undefined,
      };
    } catch (err) {
      console.error(`[EXIF] Failed for ${file}:`, err);
    }
    photos.push({ src: `/photos/${file}`, alt: path.parse(file).name, exif });
  }
  return photos;
}

export default async function Home() {
  const photos = await loadPhotos();

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-white">
      <header className="py-16 text-center">
        <h1 className="text-4xl font-thin tracking-[0.3em] uppercase text-white/90">
          Portfolio
        </h1>
        <p className="mt-3 text-sm tracking-widest text-white/40 uppercase">
          Photography by Kento
        </p>
      </header>

      <Lightbox photos={photos} />

      <footer className="text-center pb-10 text-white/20 text-xs tracking-widest uppercase">
        © 2025 Kento
      </footer>
    </main>
  );
}
