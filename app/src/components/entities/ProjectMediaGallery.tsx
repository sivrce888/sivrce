'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
  Play,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Film,
  Camera,
  Layers,
  FileText,
  BadgeCheck,
  Sparkles,
  Box,
} from 'lucide-react'
import { videoEmbedFor } from '@/lib/listing-video'

export interface ProjectMediaItem {
  type: 'photo' | 'render' | 'floorplan' | 'video' | 'virtualTour'
  src: string
  title: string
  category?: 'all' | 'architecture' | 'construction' | 'floorplans' | 'video' | 'virtualTour'
  videoUrl?: string
  virtualTourUrl?: string
  /** CC credit for hotlinked Commons photos: "Author · License". */
  credit?: string
  creditUrl?: string
}

interface ProjectMediaGalleryProps {
  projectName: string
  developerName?: string
  heroImage: string
  gallery?: string[]
  /** Attribution per gallery URL (Wikimedia Commons) — rendered under the lightbox. */
  galleryCredits?: Record<string, { author?: string; license: string; page: string }>
  passportUrl?: string
  videoUrl?: string
  virtualTourUrl?: string
  lang?: string
}

export function ProjectMediaGallery({
  projectName,
  developerName,
  heroImage,
  gallery = [],
  galleryCredits,
  passportUrl,
  videoUrl,
  virtualTourUrl,
  lang = 'ka',
}: ProjectMediaGalleryProps) {
  const isKa = lang === 'ka'
  const isRu = lang === 'ru'
  const isDe = lang === 'de'

  const t = useMemo(() => {
    if (isKa) {
      return {
        all: 'ყველა მედია',
        architecture: 'ფოტოები & რენდერები',
        construction: 'მშენებლობა & 3D',
        floorplans: 'გეგმარება',
        video: 'ვიდეო ტური',
        virtualTour: '3D ვირტუალური ტური',
        watchVideo: 'ვიდეო ტურის ნახვა',
        exploreVirtualTour: '3D ტურის გახსნა',
        verifiedTour: 'ვერიფიცირებული ვიდეო მიმოხილვა',
        verified3D: 'ინტერაქტიული 360° / 3D მოდელი',
        viewAllPhotos: 'გალერეის ნახვა',
        photoCount: (n: number) => `${n} ფოტო / რენდერი`,
        of: 'დან',
        close: 'დახურვა',
        next: 'შემდეგი',
        prev: 'წინა',
      }
    }
    if (isRu) {
      return {
        all: 'Все медиа',
        architecture: 'Фото и рендеры',
        construction: 'Ход стройки и 3D',
        floorplans: 'Планировки',
        video: 'Видеотур',
        virtualTour: '3D Виртуальный тур',
        watchVideo: 'Смотреть видеотур',
        exploreVirtualTour: 'Открыть 3D тур',
        verifiedTour: 'Верифицированный видеообзор',
        verified3D: 'Интерактивная 360° / 3D модель',
        viewAllPhotos: 'Смотреть все фото',
        photoCount: (n: number) => `${n} фото / рендеров`,
        of: 'из',
        close: 'Закрыть',
        next: 'Следующее',
        prev: 'Предыдущее',
      }
    }
    if (isDe) {
      return {
        all: 'Alle Medien',
        architecture: 'Fotos & Renderings',
        construction: 'Baufortschritt & 3D',
        floorplans: 'Grundrisse',
        video: 'Videotour',
        virtualTour: '3D-Virtuelle Tour',
        watchVideo: 'Videotour ansehen',
        exploreVirtualTour: '3D-Tour öffnen',
        verifiedTour: 'Verifizierte Videotour',
        verified3D: 'Interaktives 360° / 3D-Modell',
        viewAllPhotos: 'Alle Fotos ansehen',
        photoCount: (n: number) => `${n} Fotos & Renderings`,
        of: 'von',
        close: 'Schließen',
        next: 'Weiter',
        prev: 'Zurück',
      }
    }
    return {
      all: 'All Media',
      architecture: 'Photos & Renders',
      construction: 'Progress & 3D',
      floorplans: 'Floor Plans',
      video: 'Video Tour',
      virtualTour: '3D Virtual Tour',
      watchVideo: 'Watch Video Tour',
      exploreVirtualTour: 'Open 3D Virtual Tour',
      verifiedTour: 'Verified Video Tour',
      verified3D: 'Interactive 360° / 3D Walkthrough',
      viewAllPhotos: 'View All Photos',
      photoCount: (n: number) => `${n} Photos & Renders`,
      of: 'of',
      close: 'Close',
      next: 'Next',
      prev: 'Previous',
    }
  }, [isKa, isRu, isDe])

  // Assemble full media items
  const mediaItems: ProjectMediaItem[] = useMemo(() => {
    const items: ProjectMediaItem[] = []

    // 1. Hero image
    if (heroImage) {
      items.push({
        type: 'photo',
        src: heroImage,
        title: `${projectName} — Main View`,
        category: 'architecture',
      })
    }

    // 2. Extra gallery images & render trios
    if (gallery && gallery.length > 0) {
      for (let i = 0; i < gallery.length; i++) {
        const src = gallery[i]!
        if (src === heroImage) continue
        const isMassing = src.includes('-massing')
        const isTimeline = src.includes('-timeline')
        const isLage = src.includes('-lage')
        const isConstruction = isMassing || isTimeline || isLage
        const credit = galleryCredits?.[src]

        items.push({
          type: isConstruction ? 'render' : 'photo',
          src,
          title: isMassing
            ? `${projectName} — 3D Massing & Architecture`
            : isTimeline
              ? `${projectName} — Construction Progress & Timeline`
              : isLage
                ? `${projectName} — Location & Infrastructure Context`
                : `${projectName} — Gallery View ${i + 1}`,
          category: isConstruction ? 'construction' : 'architecture',
          ...(credit
            ? {
                credit: [credit.author, credit.license].filter(Boolean).join(' · '),
                creditUrl: credit.page,
              }
            : {}),
        })
      }
    }

    // 3. Floor plan / passport — catalog rows reuse the '-lage' render as passport; already listed above.
    if (passportUrl && passportUrl !== heroImage && !gallery?.includes(passportUrl)) {
      items.push({
        type: 'floorplan',
        src: passportUrl,
        title: `${projectName} — Floor Plan & Architectural Passport`,
        category: 'floorplans',
      })
    }

    return items
  }, [heroImage, gallery, galleryCredits, passportUrl, projectName])
  const [activeTab, setActiveTab] = useState<'all' | 'architecture' | 'construction' | 'floorplans' | 'video' | 'virtualTour'>('all')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [isPlaying3D, setIsPlaying3D] = useState(false)

  // Filter items based on active tab
  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return mediaItems
    return mediaItems.filter((it) => it.category === activeTab)
  }, [mediaItems, activeTab])

  // Count per category
  const counts = useMemo(() => {
    return {
      all: mediaItems.length + (videoUrl ? 1 : 0) + (virtualTourUrl ? 1 : 0),
      architecture: mediaItems.filter((it) => it.category === 'architecture').length,
      construction: mediaItems.filter((it) => it.category === 'construction').length,
      floorplans: mediaItems.filter((it) => it.category === 'floorplans').length,
      video: videoUrl ? 1 : 0,
      virtualTour: virtualTourUrl ? 1 : 0,
    }
  }, [mediaItems, videoUrl, virtualTourUrl])

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIdx === null) return
      if (e.key === 'Escape') {
        setLightboxIdx(null)
      } else if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) => (prev !== null ? (prev + 1) % mediaItems.length : 0))
      } else if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) => (prev !== null ? (prev - 1 + mediaItems.length) % mediaItems.length : 0))
      }
    },
    [lightboxIdx, mediaItems.length]
  )

  useEffect(() => {
    if (lightboxIdx !== null) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxIdx, handleKeyDown])

  const videoEmbed = videoEmbedFor(videoUrl)

  return (
    <section id="gallery" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 py-12 md:px-10">
      {/* Header & Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sv-ink/[0.08] pb-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {t.all}
          </h2>
          <p className="mt-0.5 text-[13px] font-bold text-sv-ink/60">
            {t.photoCount(mediaItems.length)}
            {videoUrl ? ` · 1 ${t.video}` : ''}
            {virtualTourUrl ? ` · 1 ${t.virtualTour}` : ''}
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-sv-ink/[0.04] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
              activeTab === 'all'
                ? 'bg-sv-ink text-white shadow-sm'
                : 'text-sv-ink/70 hover:bg-sv-ink/[0.06] hover:text-sv-ink'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            {t.all} ({counts.all})
          </button>

          {counts.architecture > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                activeTab === 'architecture'
                  ? 'bg-sv-ink text-white shadow-sm'
                  : 'text-sv-ink/70 hover:bg-sv-ink/[0.06] hover:text-sv-ink'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              {t.architecture} ({counts.architecture})
            </button>
          )}

          {counts.video > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                activeTab === 'video'
                  ? 'bg-sv-orange text-white shadow-sm'
                  : 'text-sv-ink/70 hover:bg-sv-ink/[0.06] hover:text-sv-ink'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              {t.video}
            </button>
          )}

          {counts.virtualTour > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('virtualTour')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                activeTab === 'virtualTour'
                  ? 'bg-sv-blue text-white shadow-sm'
                  : 'text-sv-ink/70 hover:bg-sv-ink/[0.06] hover:text-sv-ink'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              {t.virtualTour}
            </button>
          )}

          {counts.construction > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('construction')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                activeTab === 'construction'
                  ? 'bg-sv-ink text-white shadow-sm'
                  : 'text-sv-ink/70 hover:bg-sv-ink/[0.06] hover:text-sv-ink'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t.construction} ({counts.construction})
            </button>
          )}

          {counts.floorplans > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('floorplans')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                activeTab === 'floorplans'
                  ? 'bg-sv-ink text-white shadow-sm'
                  : 'text-sv-ink/70 hover:bg-sv-ink/[0.06] hover:text-sv-ink'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              {t.floorplans} ({counts.floorplans})
            </button>
          )}
        </div>
      </div>

      {/* 3D Virtual Tour Showcase */}
      {virtualTourUrl && (activeTab === 'all' || activeTab === 'virtualTour') && (
        <div className="mt-8 overflow-hidden rounded-card border border-sv-blue/20 bg-sv-navy text-white shadow-card">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sv-blue/20 px-3 py-1 text-[12px] font-black uppercase tracking-wide text-sv-blue">
                  <Box className="h-3.5 w-3.5" />
                  {t.virtualTour}
                </span>
                <span className="hidden text-[13px] font-bold text-white/70 sm:inline">
                  {t.verified3D}
                </span>
              </div>
              {developerName && (
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-white/80">
                  <BadgeCheck className="h-4 w-4 text-sv-blue" />
                  {developerName}
                </div>
              )}
            </div>

            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-module bg-black">
              {isPlaying3D ? (
                <iframe
                  src={virtualTourUrl}
                  title={`${projectName} 3D Virtual Tour`}
                  allow="vr; xr; accelerometer; gyroscope; fullscreen"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="group relative h-full w-full cursor-pointer" onClick={() => setIsPlaying3D(true)}>
                  <Image
                    src={heroImage}
                    alt={`${projectName} 3D Tour Cover`}
                    fill
                    sizes="(max-width: 1440px) 100vw, 1440px"
                    className="object-cover brightness-75 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <button
                      type="button"
                      aria-label={t.exploreVirtualTour}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-sv-blue text-white shadow-glow-blue transition-transform duration-300 hover:scale-110 md:h-20 md:w-20"
                    >
                      <Box className="h-8 w-8 md:h-10 md:w-10" />
                    </button>
                    <h3 className="mt-4 text-[18px] font-black tracking-tight text-white md:text-[22px]">
                      {projectName}
                    </h3>
                    <p className="mt-1 text-[13px] font-bold text-white/80">
                      {t.exploreVirtualTour}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Video Tour Showcase (When video exists and activeTab is 'all' or 'video') */}
      {videoUrl && (activeTab === 'all' || activeTab === 'video') && (
        <div className="mt-8 overflow-hidden rounded-card border border-sv-ink/[0.08] bg-sv-navy text-white shadow-card">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange/20 px-3 py-1 text-[12px] font-black uppercase tracking-wide text-sv-orange">
                  <Film className="h-3.5 w-3.5" />
                  {t.video}
                </span>
                <span className="hidden text-[13px] font-bold text-white/70 sm:inline">
                  {t.verifiedTour}
                </span>
              </div>
              {developerName && (
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-white/80">
                  <BadgeCheck className="h-4 w-4 text-sv-blue" />
                  {developerName}
                </div>
              )}
            </div>

            {/* Video Player Box */}
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-module bg-black">
              {isPlayingVideo && videoEmbed ? (
                videoEmbed.type === 'native' ? (
                  <video
                    src={videoEmbed.url}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <iframe
                    src={videoEmbed.url}
                    title={`${projectName} Video Tour`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                )
              ) : (
                <div className="group relative h-full w-full cursor-pointer" onClick={() => setIsPlayingVideo(true)}>
                  <Image
                    src={heroImage}
                    alt={`${projectName} video cover`}
                    fill
                    sizes="(max-width: 1440px) 100vw, 1440px"
                    className="object-cover brightness-75 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <button
                      type="button"
                      aria-label={t.watchVideo}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-sv-orange text-white shadow-glow-orange-lg transition-transform duration-300 hover:scale-110 md:h-20 md:w-20"
                    >
                      <Play className="ml-1 h-8 w-8 fill-current md:h-10 md:w-10" />
                    </button>
                    <h3 className="mt-4 text-[18px] font-black tracking-tight text-white md:text-[22px]">
                      {projectName}
                    </h3>
                    <p className="mt-1 text-[13px] font-bold text-white/70">
                      {t.watchVideo}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Photos and Renders */}
      {activeTab !== 'video' && activeTab !== 'virtualTour' && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredItems.map((item) => {
            const globalIndex = mediaItems.findIndex((m) => m.src === item.src)
            return (
              <div
                key={item.src}
                onClick={() => setLightboxIdx(globalIndex >= 0 ? globalIndex : 0)}
                className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-module border border-sv-ink/[0.06] bg-sv-cloud shadow-sm transition duration-300 hover:scale-[1.02] hover:shadow-md"
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                {/* Overlay Badge & Expand Icon */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="truncate rounded-control bg-sv-navy/80 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                    {item.type === 'render' ? '3D Render' : item.type === 'floorplan' ? 'Floor Plan' : 'Photo'}
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sv-ink shadow">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxIdx !== null && mediaItems[lightboxIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md transition duration-300"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="rounded-control bg-white/15 px-3 py-1 text-[13px] font-bold">
                {lightboxIdx + 1} {t.of} {mediaItems.length}
              </span>
              <span className="hidden text-[14px] font-semibold text-white/80 md:inline">
                {mediaItems[lightboxIdx]!.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label={t.close}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Center Stage */}
          <div className="relative flex flex-1 items-center justify-center p-4">
            <div className="relative h-full max-h-[82vh] w-full max-w-[1280px]">
              <Image
                src={mediaItems[lightboxIdx]!.src}
                alt={mediaItems[lightboxIdx]!.title}
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {/* Navigation Arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIdx((prev) => (prev !== null ? (prev - 1 + mediaItems.length) % mediaItems.length : 0))}
                  className="absolute left-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:scale-110 hover:bg-white/30"
                  aria-label={t.prev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIdx((prev) => (prev !== null ? (prev + 1) % mediaItems.length : 0))}
                  className="absolute right-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:scale-110 hover:bg-white/30"
                  aria-label={t.next}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* CC credit for hotlinked Commons photos (language-neutral: author · license). */}
          {mediaItems[lightboxIdx]!.creditUrl && (
            <p className="px-6 pb-1 text-center text-[12px] font-semibold text-white/60">
              {mediaItems[lightboxIdx]!.credit}{' · '}
              <a
                href={mediaItems[lightboxIdx]!.creditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-white"
              >
                Wikimedia Commons
              </a>
            </p>
          )}

          {/* Bottom Thumbnails Strip */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto px-6 py-4">
            {mediaItems.map((item, idx) => (
              <button
                key={item.src}
                type="button"
                onClick={() => setLightboxIdx(idx)}
                className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-control border-2 transition ${
                  lightboxIdx === idx ? 'border-sv-orange ring-2 ring-sv-orange/40' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
