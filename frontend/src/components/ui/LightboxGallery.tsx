import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface LightboxGalleryProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const LightboxGallery = ({
  images,
  initialIndex,
  isOpen,
  onClose,
}: LightboxGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);

  // Sync index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex, images]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailsContainerRef.current) return;
    const container = thumbnailsContainerRef.current;
    const activeItem = container.children[currentIndex] as HTMLElement;
    if (activeItem) {
      const containerWidth = container.offsetWidth;
      const itemLeft = activeItem.offsetLeft;
      const itemWidth = activeItem.offsetWidth;
      container.scrollTo({
        left: itemLeft - containerWidth / 2 + itemWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = () => {
    const url = images[currentIndex];
    // Force open in new tab for downloading/saving
    window.open(url, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/80 backdrop-blur-md p-4 md:p-6 animate-fade-in select-none">
      
      {/* Top bar */}
      <div className="flex items-center justify-end text-white shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Open original / Download"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative flex-1 flex items-center justify-center min-h-0 w-full my-4">
        {/* Prev Button */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 md:left-4 z-10 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white active:scale-95 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 md:right-4 z-10 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white active:scale-95 transition-all"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Image Container */}
        <div className="w-full h-full max-h-[70vh] flex items-center justify-center p-2">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-in"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Thumbnail Bar */}
      {images.length > 1 && (
        <div className="shrink-0 flex justify-center py-2 w-full z-10">
          <div
            ref={thumbnailsContainerRef}
            className="flex gap-2 overflow-x-auto max-w-full px-8 py-2 scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-all ${
                  idx === currentIndex
                    ? 'ring-2 ring-primary-500 scale-105 opacity-100'
                    : 'opacity-40 hover:opacity-75'
                }`}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};
