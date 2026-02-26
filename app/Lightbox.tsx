"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";
import type { PhotoData } from "@/lib/photos";

export type { PhotoData };

export default function Lightbox({ photos }: { photos: PhotoData[] }) {
    const [selected, setSelected] = useState<PhotoData | null>(null);
    const [zoomDisplay, setZoomDisplay] = useState(1);

    const lightboxRef = useRef<HTMLDivElement>(null);
    const imgContainerRef = useRef<HTMLDivElement>(null);

    const zoomRef = useRef(1);
    const translateRef = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const dragOriginTranslate = useRef({ x: 0, y: 0 });

    const applyTransform = useCallback(() => {
        if (!imgContainerRef.current) return;
        const { x, y } = translateRef.current;
        const z = zoomRef.current;
        imgContainerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
        imgContainerRef.current.style.transformOrigin = "50% 50%";
    }, []);

    const openLightbox = (photo: PhotoData) => {
        zoomRef.current = 1;
        translateRef.current = { x: 0, y: 0 };
        setZoomDisplay(1);
        setSelected(photo);
    };

    const closeLightbox = () => setSelected(null);

    useEffect(() => {
        if (selected) requestAnimationFrame(() => applyTransform());
    }, [selected, applyTransform]);

    const handleWheel = useCallback(
        (e: WheelEvent) => {
            e.preventDefault();
            const rect = lightboxRef.current?.getBoundingClientRect();
            if (!rect) return;

            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;

            const oldZoom = zoomRef.current;
            const delta = e.deltaY < 0 ? 0.12 : -0.12;
            const newZoom = Math.min(Math.max(oldZoom + delta, 0.5), 8);
            const ratio = newZoom / oldZoom;

            translateRef.current = {
                x: mouseX - (mouseX - translateRef.current.x) * ratio,
                y: mouseY - (mouseY - translateRef.current.y) * ratio,
            };
            zoomRef.current = newZoom;

            applyTransform();
            setZoomDisplay(Math.round(newZoom * 100));
        },
        [applyTransform]
    );

    useEffect(() => {
        const el = lightboxRef.current;
        if (!el || !selected) return;
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [selected, handleWheel]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        dragOriginTranslate.current = { ...translateRef.current };
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging.current) return;
            translateRef.current = {
                x: dragOriginTranslate.current.x + (e.clientX - dragStart.current.x),
                y: dragOriginTranslate.current.y + (e.clientY - dragStart.current.y),
            };
            applyTransform();
        },
        [applyTransform]
    );

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    return (
        <>
            {/* Photo Grid */}
            <section className="max-w-6xl mx-auto px-6 pb-28">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {photos.map((photo) => (
                        <div
                            key={photo.src}
                            className="group relative overflow-hidden rounded-sm bg-[#ebebeb] cursor-zoom-in"
                            onClick={() => openLightbox(photo)}
                        >
                            <Image
                                src={photo.src}
                                alt={photo.alt}
                                width={900}
                                height={600}
                                quality={90}
                                className="w-full h-auto object-contain transition-transform duration-700 ease-in-out group-hover:scale-[1.02]"
                                sizes="(max-width: 640px) 100vw, 50vw"
                            />
                            {/* EXIF on hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-500 flex flex-col justify-end pointer-events-none">
                                <div className="w-full px-5 py-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col gap-1">
                                    {(photo.exif.camera || photo.exif.lens) && (
                                        <p className="text-white/90 text-xs tracking-widest font-mono">
                                            {photo.exif.camera}
                                            {photo.exif.lens ? ` · ${photo.exif.lens}` : ""}
                                        </p>
                                    )}
                                    <div className="flex gap-4 text-white/55 text-xs tracking-widest font-mono">
                                        {photo.exif.aperture && <span>{photo.exif.aperture}</span>}
                                        {photo.exif.shutter && <span>{photo.exif.shutter}</span>}
                                        {photo.exif.iso && <span>ISO {photo.exif.iso}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Lightbox */}
            {selected && (
                <div
                    ref={lightboxRef}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm select-none"
                    onClick={closeLightbox}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => { isDragging.current = false; }}
                >
                    {/* Close */}
                    <button
                        className="absolute top-5 right-6 text-white/60 hover:text-white text-3xl leading-none transition-colors z-10"
                        onClick={closeLightbox}
                    >
                        ×
                    </button>

                    {/* Zoom % */}
                    <span className="absolute top-6 left-6 text-white/30 text-xs tracking-widest pointer-events-none">
                        {zoomDisplay}%
                    </span>

                    {/* EXIF info */}
                    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none">
                        {(selected.exif.camera || selected.exif.lens) && (
                            <p className="text-white/60 text-xs tracking-widest font-mono">
                                {selected.exif.camera}
                                {selected.exif.lens ? ` · ${selected.exif.lens}` : ""}
                            </p>
                        )}
                        <div className="flex gap-6 text-white/35 text-xs tracking-widest font-mono">
                            {selected.exif.aperture && <span>{selected.exif.aperture}</span>}
                            {selected.exif.shutter && <span>{selected.exif.shutter}</span>}
                            {selected.exif.iso && <span>ISO {selected.exif.iso}</span>}
                        </div>
                    </div>

                    {/* Image */}
                    <div
                        ref={imgContainerRef}
                        className="relative w-full h-full max-w-5xl max-h-[90vh] mx-6"
                        style={{ cursor: zoomDisplay > 100 ? "grab" : "zoom-out" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={selected.src}
                            alt={selected.alt}
                            fill
                            unoptimized
                            className="object-contain"
                            sizes="100vw"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
