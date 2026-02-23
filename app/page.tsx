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
      const fnumber = data?.Photo?.FNumber ?? data?.Exif?.FNumber;
      const iso = data?.Photo?.ISOSpeedRatings ?? data?.Exif?.ISOSpeedRatings;
      const expTime = data?.Photo?.ExposureTime ?? data?.Exif?.ExposureTime;
      const make = (data?.Image?.Make as string | undefined)?.replace("SONY", "Sony");
      const model = data?.Image?.Model as string | undefined;
      const lens = data?.Photo?.LensModel as string | undefined;
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
