'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
}

export function ImageCarousel({ images, alt = 'Product' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-6">
      {/* Main Image Display */}
      <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-gray-200 bg-linear-to-br from-gray-50 to-gray-100 aspect-video w-full group">
        {/* Image */}
        <img
          src={images[currentIndex]}
          alt={`${alt} - Slide ${currentIndex + 1}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
          onClick={() => setIsLightboxOpen(true)}
        />

        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Left Arrow */}
        {images.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/90 hover:bg-white text-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right Arrow */}
        {images.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/90 hover:bg-white text-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 z-10"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Slide Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl bg-black/70 text-white text-sm font-semibold backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Indicators */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'relative shrink-0 h-20 w-28 rounded-lg overflow-hidden border-2 transition-all duration-200 active:scale-95',
                currentIndex === index
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <img
                src={image}
                alt={`${alt} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {currentIndex === index && (
                <div className="absolute inset-0 bg-black/10" />
              )}
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/85 backdrop-blur-md transition-all duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-300 p-2.5 bg-black/40 hover:bg-black/60 rounded-full transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={images[currentIndex]}
            alt={`${alt} full view`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
