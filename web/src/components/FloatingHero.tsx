"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Building } from "./Building";
import { ClaimPanel } from "./ClaimPanel";
import { HeroBackdrop } from "./HeroBackdrop";
import { BUILDING_POSITIONS, depthFor } from "@/lib/layout";
import type { PublicBuilding } from "@/lib/types";

/** Placeholder marketing copy — swap for real numbers once the board has real traffic. */
const FOUNDERS_ACTIVE = "327 founders active";
const BUILDINGS_CLAIMED = "10,000+ buildings claimed";

export function FloatingHero({ buildings }: { buildings: PublicBuilding[] }) {
  const [selected, setSelected] = useState<PublicBuilding | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [dragging, setDragging] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  const owned = buildings.filter((b) => b.status === "owned");
  const trendingId = owned.reduce<string | null>(
    (best, b) => (b.takeover_count > 0 && (!best || b.takeover_count > (owned.find((x) => x.id === best)?.takeover_count ?? 0)) ? b.id : best),
    null
  );

  function updateTilt(clientX: number, clientY: number) {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    setTilt({ rx: -(py - 0.5) * 12, ry: (px - 0.5) * 20 });
  }

  return (
    <section id="top" className="relative overflow-hidden pb-10 pt-8" style={{ perspective: 1400 }}>
      <div
        ref={sceneRef}
        className="relative mx-auto min-h-[820px] max-w-[1600px] touch-none select-none sm:min-h-[880px]"
        onPointerDown={(e) => {
          setDragging(true);
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          updateTilt(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => dragging && updateTilt(e.clientX, e.clientY)}
        onPointerUp={() => {
          setDragging(false);
          setTilt({ rx: 0, ry: 0 });
        }}
        onPointerLeave={() => {
          if (dragging) {
            setDragging(false);
            setTilt({ rx: 0, ry: 0 });
          }
        }}
      >
        {/* Drag anywhere on the scene to tilt it — a cheap, deliberate fake-3D
            effect: the whole plane rotates as one rigid sheet rather than a real
            3D scene, which is both simpler and less finicky than it looks. */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
          transition={dragging ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 16 }}
          style={{ transformStyle: "preserve-3d", cursor: dragging ? "grabbing" : "grab" }}
        >
          <HeroBackdrop />
          {/* Drop your artwork at public/hero.jpg and it covers the SVG backdrop
              automatically; a missing file just leaves this layer transparent. */}
          <div className="absolute inset-0 -z-[2] bg-cover bg-center" style={{ backgroundImage: "url('/hero.jpg')" }} />
          <div className="absolute inset-0 -z-[1] bg-gradient-to-b from-white/10 via-transparent to-canvas" />

          {buildings.map((b, i) => {
            const pos = BUILDING_POSITIONS[i % BUILDING_POSITIONS.length];
            const { scale, opacity } = depthFor(pos.y);
            return (
              <div
                key={b.id}
                className="absolute"
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: `scale(${scale})`, opacity, zIndex: Math.round(pos.y) }}
              >
                <Building building={b} selected={selected?.id === b.id} trending={b.id === trendingId} onSelect={setSelected} />
              </div>
            );
          })}
        </motion.div>

        {/* Copy + panel float above the tilting scene, always upright and legible. */}
        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center px-5 pt-4 text-center">
          <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3.5 py-1.5 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {FOUNDERS_ACTIVE} · {BUILDINGS_CLAIMED}
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.05] text-ink sm:text-6xl">
            Own Your Space<br className="hidden sm:block" /> on the Internet
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-brand-900/70">Claim land. Pay once. Get discovered.</p>
          <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#top" className="btn btn-primary text-base">Start Claiming Land</a>
            <a href="#how" className="btn btn-secondary text-sm">How it works</a>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[60%] z-20 flex justify-center px-5 sm:top-40 sm:justify-end sm:pr-8">
          <div className="pointer-events-auto w-full max-w-sm">
            <ClaimPanel building={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      </div>
    </section>
  );
}
