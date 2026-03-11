'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NftMedia } from './NftMedia';

export interface GalleryNft {
  identifier: string;
  name: string;
  imageUrl?: string;
  originalImageUrl?: string | null;
  mimeType?: string;
  collection?: string;
  collectionName?: string;
  thumbnailUrl?: string | null;
  type?: string;
  balance?: string;
  metadata?: Record<string, any>;
}

interface GalleryCarouselProps {
  items: GalleryNft[];
  onItemClick?: (item: GalleryNft, index: number) => void;
}

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 300;

const GalleryCarousel: React.FC<GalleryCarouselProps> = ({ items, onItemClick }) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Wrap index
  const currentIndex = ((page % items.length) + items.length) % items.length;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const paginate = useCallback((newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
        paginate(1);
      } else if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
        paginate(-1);
      }
    },
    [paginate]
  );

  const handlePointerDown = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handlePointerMove = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleItemClick = useCallback(() => {
    if (!isDragging.current && onItemClick) {
      onItemClick(items[currentIndex], currentIndex);
    }
  }, [currentIndex, items, onItemClick]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p className="text-sm font-bold">This folder is empty</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 md:gap-8">
      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md aspect-square overflow-hidden rounded-3xl md:rounded-[2rem] bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/30 cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleItemClick}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'tween', duration: 0.3, ease: 'easeInOut' },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 will-change-transform"
            style={{ touchAction: 'pan-y' }}
          >
            <NftMedia
              src={currentItem.imageUrl || `https://picsum.photos/seed/${currentItem.identifier}/600/600`}
              alt={currentItem.name}
              mimeType={currentItem.mimeType}
              thumbnailFallback={currentItem.thumbnailUrl || undefined}
              className="w-full h-full object-cover pointer-events-none select-none"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>

        {/* Desktop Navigation Arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); paginate(-1); }}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 items-center justify-center text-white hover:bg-black/70 hover:scale-110 active:scale-95 transition-all"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); paginate(1); }}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 items-center justify-center text-white hover:bg-black/70 hover:scale-110 active:scale-95 transition-all"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter Badge */}
        {items.length > 1 && (
          <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-xl text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-white/10">
            {currentIndex + 1} / {items.length}
          </div>
        )}

        {/* Tap hint overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider md:hidden">Tap for details · Swipe to browse</span>
          <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider hidden md:inline">Click for details</span>
        </div>
      </div>

      {/* NFT Name */}
      <motion.div
        key={`name-${currentIndex}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center cursor-pointer"
        onClick={handleItemClick}
      >
        <h3 className="text-lg md:text-xl font-black text-white">
          {currentItem.name}
        </h3>
        {currentItem.collection && (
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
            {currentItem.collection}
          </p>
        )}
      </motion.div>

      {/* Dot Indicators */}
      {items.length > 1 && items.length <= 20 && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[280px]">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const dir = index > currentIndex ? 1 : -1;
                setPage([index, dir]);
              }}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-6 h-2 bg-orange-500 shadow-lg shadow-orange-500/30'
                  : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to item ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryCarousel;
