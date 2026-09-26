'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Play,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Film,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { videoEmbedFor } from '@/lib/listing-video'

export interface DeveloperMediaItem {
  src: string
  title: string
  projectSlug?: string
  projectName?: string
  projectCity?: string
  type: 'photo' | 'render' | 'video'
}

interface DeveloperMediaGalleryProps {
  developerName: string
  videoUrl?: string
  photos: string[]
  projects: Array<{
    slug: string
    name: string
    city: string
    img: string
    videoUrl?: string
  }>
  lang?: string
}

export function DeveloperMediaGallery({
  developerName,
  videoUrl,
  photos = [],
  projects = [],
  lang = 'ka',
}: DeveloperMediaGalleryProps) {
  const isKa = lang === 'ka'
  const isRu = lang === 'ru'
  const isDe = lang === 'de'

  const t = useMemo(() => {
    if (isKa) {
      return {
        heading: 'პორტფოლიოს გალერეა & ვიდეო',
        sub: 'დეველოპერის მიმდინარე და ჩაბარებული პროექტების არქიტექტურული ფოტოები და ვიდეო მიმოხილვები',
        video: 'პრეზენტაცია',
        watchVideo: 'ვიდეოს ნახვა',
        photosCount: (n: number) => `${n} ფოტო / რენდერი`,
        viewProject: 'პროექტის გვერდი',
        of: 'დან',
        close: 'დახურვა',
        next: 'შემდეგი',
        prev: 'წინა',
      }
    }
    if (isRu) {
      return {
        heading: 'Галерея портфолио и видео',
        sub: 'Архитектурные фотографии и видеообзоры строящихся и сданных проектов застройщика',
        video: 'Презентация',
        watchVideo: 'Смотреть видео',
        photosCount: (n: number) => `${n} фото / рендеров`,
        viewProject: 'Страница проекта',
        of: 'из',
        close: 'Закрыть',
        next: 'Следующее',
        prev: 'Предыдущее',
      }
    }
    if (isDe) {
      return {
        heading: 'Portfolio-Galerie & Videos',
        sub: 'Architekturfotos und Videotouren der aktuellen und fertiggestellten Projekte des Entwicklers',
        video: 'Präsentation',
        watchVideo: 'Video ansehen',
        photosCount: (n: number) => `${n} Fotos & Renderings`,
        viewProject: 'Projektseite',
        of: 'von',
        close: 'Schließen',
        next: 'Weiter',
        prev: 'Zurück',
      }
    }
    return {
      heading: 'Portfolio Gallery & Video',
      sub: 'Architectural photography and video walkthroughs of active and delivered projects',
      video: 'Presentation',
      watchVideo: 'Watch Video',
      photosCount: (n: number) => `${n} Photos & Renders`,
      viewProject: 'View Project',
      of: 'of',
      close: 'Close',
      next: 'Next',
      prev: 'Previous',
    }
  }, [isKa, isRu, isDe])

  // Build items with project metadata
  const mediaItems: DeveloperMediaItem[] = useMemo(() => {
    const list: DeveloperMediaItem[] = []
    const seen = new Set<string>()

    // Project hero photos first
    for (const p of projects) {
      if (p.img && !seen.has(p.img)) {
        seen.add(p.img)
        list.push({
          src: p.img,
          title: `${p.name} — ${p.city}`,
          projectName: p.name,
          projectCity: p.city,
          projectSlug: p.slug,
          type: 'photo',
        })
      }
    }

    // Extra gallery photos
    for (const src of photos) {
      if (!seen.has(src)) {
        seen.add(src)
        list.push({
          src,
          title: `${developerName} — Portfolio Architecture`,
          type: src.includes('-massing') || src.includes('-timeline') || src.includes('-lage') ? 'render' : 'photo',
        })
      }
    }

    return list
  }, [projects, photos, developerName])

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)

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

  if (mediaItems.length === 0 && !videoUrl) return null

  return (
    <section id="photos" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 py-12 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-sv-ink/[0.08] pb-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {t.heading}
          </h2>
          <p className="mt-1 text-[13px] font-bold text-sv-ink/60">
            {t.sub} ({t.photosCount(mediaItems.length)})
          </p>
        </div>
      </div>

      {/* Official Developer Video Showcase */}
      {videoUrl && (
        <div className="mt-8 overflow-hidden rounded-card border border-sv-ink/[0.08] bg-sv-navy text-white shadow-card">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange/20 px-3 py-1 text-[12px] font-black uppercase tracking-wide text-sv-orange">
                <Film className="h-3.5 w-3.5" />
                {t.video}
              </span>
              <span className="text-[13px] font-bold text-white/80">
                {developerName} Official Showcase
              </span>
            </div>

            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-module bg-black">
              {isPlayingVideo && videoEmbed ? (
                videoEmbed.type === 'native' ? (
                  <video src={videoEmbed.url} controls autoPlay playsInline className="h-full w-full object-contain" />
                ) : (
                  <iframe
                    src={videoEmbed.url}
                    title={`${developerName} Showcase`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                )
              ) : (
                <div
                  className="group relative h-full w-full cursor-pointer"
                  onClick={() => setIsPlayingVideo(true)}
                >
                  {mediaItems[0] && (
                    <Image
                      src={mediaItems[0].src}
                      alt={`${developerName} video cover`}
                      fill
                      sizes="(max-width: 1440px) 100vw, 1440px"
                      className="object-cover brightness-75 transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
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
                      {developerName}
                    </h3>
                    <p className="mt-1 text-[13px] font-bold text-white/70">{t.watchVideo}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Portfolio Media */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {mediaItems.map((item, idx) => (
          <div
            key={item.src}
            onClick={() => setLightboxIdx(idx)}
            className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-module border border-sv-ink/[0.06] bg-sv-cloud shadow-sm transition duration-300 hover:scale-[1.02] hover:shadow-md"
          >
            <Image
              src={item.src}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="min-w-0 flex-1 pr-2">
                <p className="truncate text-[12px] font-black text-white">{item.projectName || developerName}</p>
                {item.projectCity && <p className="truncate text-[10px] font-semibold text-white/75">{item.projectCity}</p>}
              </div>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sv-ink shadow">
                <Maximize2 className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
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
              <span className="text-[14px] font-semibold text-white/80">
                {mediaItems[lightboxIdx]!.title}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {mediaItems[lightboxIdx]!.projectSlug && (
                <Link
                  href={`/projects/${mediaItems[lightboxIdx]!.projectSlug}`}
                  className="inline-flex items-center gap-1.5 rounded-control bg-sv-blue px-3 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-sv-blue-deep"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {t.viewProject}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                aria-label={t.close}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Photo */}
          <div className="relative flex flex-1 items-center justify-center px-4 py-2">
            <div className="relative h-full max-h-[82vh] w-full max-w-6xl">
              <Image
                src={mediaItems[lightboxIdx]!.src}
                alt={mediaItems[lightboxIdx]!.title}
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            </div>

            <button
              type="button"
              onClick={() => setLightboxIdx((lightboxIdx - 1 + mediaItems.length) % mediaItems.length)}
              aria-label={t.prev}
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:scale-110 hover:bg-white/40"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={() => setLightboxIdx((lightboxIdx + 1) % mediaItems.length)}
              aria-label={t.next}
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:scale-110 hover:bg-white/40"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Bottom Thumbnail Strip */}
          <div className="flex h-20 items-center justify-center gap-2 overflow-x-auto px-4 py-3">
            {mediaItems.map((item, idx) => (
              <button
                key={item.src}
                type="button"
                onClick={() => setLightboxIdx(idx)}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-control border-2 transition ${
                  idx === lightboxIdx
                    ? 'border-sv-orange scale-105 opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <Image src={item.src} alt="thumb" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
