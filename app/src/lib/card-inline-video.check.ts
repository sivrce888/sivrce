import assert from 'node:assert/strict'
import {
  inlineVideoEmbedFor,
  getActiveVideoCard,
  setActiveVideoCard,
  subscribeActiveVideoCard,
  videoMutedPreference,
  setVideoMutedPreference,
} from './listing-video'

console.log('card-inline-video.check: starting assertions...')

// 1. YouTube inline embed: nocookie host, autoplay=1, mute=1, playsinline=1, loop
const yt = inlineVideoEmbedFor('https://www.youtube.com/watch?v=kYJv8XmD-7g', true)
assert.ok(yt, 'YouTube embed must be resolved')
assert.equal(yt.type, 'youtube')
assert.ok(yt.url.includes('youtube-nocookie.com/embed/kYJv8XmD-7g'))
assert.ok(yt.url.includes('autoplay=1'))
assert.ok(yt.url.includes('mute=1'))
assert.ok(yt.url.includes('playsinline=1'))
assert.ok(yt.url.includes('loop=1'))

// 2. YouTube unmuted preview mode
const ytUnmuted = inlineVideoEmbedFor('https://youtu.be/kYJv8XmD-7g', false)
assert.ok(ytUnmuted)
assert.ok(ytUnmuted.url.includes('mute=0'))

// 3. Vimeo inline embed
const vm = inlineVideoEmbedFor('https://vimeo.com/76979871', true)
assert.ok(vm)
assert.equal(vm.type, 'vimeo')
assert.ok(vm.url.includes('player.vimeo.com/video/76979871'))
assert.ok(vm.url.includes('autoplay=1'))
assert.ok(vm.url.includes('muted=1'))

// 4. Cloudflare stream inline embed
const st = inlineVideoEmbedFor('https://iframe.videodelivery.net/0123456789abcdef0123456789abcdef', true)
assert.ok(st)
assert.equal(st.type, 'stream')
assert.ok(st.url.includes('autoplay=true'))
assert.ok(st.url.includes('muted=true'))

// 5. Native CDN file
const nativeUrl = 'https://cdn.sivrce.ge/uploads/2026/09/3f4b2c1a-9b2e-4c3d-8f1a-2b3c4d5e6f7a.mp4'
const nv = inlineVideoEmbedFor(nativeUrl, true)
assert.ok(nv)
assert.equal(nv.type, 'native')
assert.equal(nv.url, nativeUrl)

// 6. Invalid / untrusted URLs reject cleanly
assert.equal(inlineVideoEmbedFor(undefined), null)
assert.equal(inlineVideoEmbedFor(''), null)
assert.equal(inlineVideoEmbedFor('https://evil.com/video.mp4'), null)
assert.equal(inlineVideoEmbedFor('javascript:alert(1)'), null)

// 7. Concurrency governor singleton: exactly one active card video globally
let notificationCount = 0
let lastNotifiedId: string | null = null

const unsubscribe = subscribeActiveVideoCard((id) => {
  notificationCount++
  lastNotifiedId = id
})

assert.equal(getActiveVideoCard(), null)
setActiveVideoCard('card-1')
assert.equal(getActiveVideoCard(), 'card-1')
assert.equal(lastNotifiedId, 'card-1')

// Switching to Card 2 preempts Card 1
setActiveVideoCard('card-2')
assert.equal(getActiveVideoCard(), 'card-2')
assert.equal(lastNotifiedId, 'card-2')

// Closing resets to null
setActiveVideoCard(null)
assert.equal(getActiveVideoCard(), null)
assert.equal(lastNotifiedId, null)

unsubscribe()

// Setting after unsubscribe should not trigger listener
const prevCount = notificationCount
setActiveVideoCard('card-3')
assert.equal(notificationCount, prevCount)
setActiveVideoCard(null)

// Session mute preference: defaults muted, round-trips, defaults don't leak
assert.equal(videoMutedPreference(), true, 'videos must start muted')
setVideoMutedPreference(false)
assert.equal(videoMutedPreference(), false, 'unmute must persist for the session')
setVideoMutedPreference(true)
assert.equal(videoMutedPreference(), true)

console.log('card-inline-video.check: OK ✓ — Apple-grade inline video engine verified')
