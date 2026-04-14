import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/plugins/counter.css'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import { cn } from '@/lib/utils'
import { ZoomIn } from 'lucide-react'

interface VehicleGalleryProps {
  images: string[]
  vehicleName: string
}

export function VehicleGallery({ images, vehicleName }: VehicleGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const slides = images.map(src => ({ src }))

  return (
    <div>
      {/* Main image */}
      <button
        id="vehicle-gallery-main"
        className="relative w-full aspect-[16/10] overflow-hidden rounded-xl cursor-zoom-in group block"
        style={{ background: 'var(--color-surface-2)' }}
        onClick={() => setLightboxOpen(true)}
        aria-label="Open gallery"
      >
        <img
          src={images[activeIndex]}
          alt={`${vehicleName} — photo ${activeIndex + 1}`}
          className="w-full h-full object-cover transition-slow group-hover:scale-[1.02]"
          onError={e => { e.currentTarget.src = '/placeholder-vehicle.svg' }}
        />
        <div className="absolute bottom-2 right-2 btn btn-sm gap-1 opacity-0 group-hover:opacity-100 transition-fast pointer-events-none"
          style={{ background: 'oklch(0% 0 0 / 65%)', color: 'white', backdropFilter: 'blur(4px)' }}>
          <ZoomIn size={13} />
          View {images.length} photos
        </div>
      </button>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              id={`vehicle-thumb-${i}`}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-fast',
                i === activeIndex
                  ? 'border-[var(--color-brand-400)] opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80'
              )}
              style={{ background: 'var(--color-surface-2)' }}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = '/placeholder-vehicle.svg' }} />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={activeIndex}
        on={{ view: ({ index }) => setActiveIndex(index) }}
        plugins={[Counter, Thumbnails]}
      />
    </div>
  )
}
