/**
 * Construction 1:1 massing — MapLibre custom layer + three.js (GLB / façade wrap).
 * ACTIVE PATH: syncConstructionRenders is a no-op — MapLibre TAS/OSM extrusion only.
 * Restore photo-wrap: reinstate ensureConstruction3D + api.sync in syncConstructionRenders
 * and re-import it from Map3D.tsx.
 * ponytail: Cesium skipped (second engine); add when Google Photorealistic 3D Tiles needed.
 */

import * as maplibregl from 'maplibre-gl'
import {
  type CustomLayerInterface,
  type CustomRenderMethodInput,
  type Map as MlMap,
} from 'maplibre-gl'
import {
  clusterRings,
  type MapBuildingCluster,
} from '@/lib/map/buildings'
import { MAP_CENTER } from '@/lib/map/map-geo'
import { ringCentroid } from '@/lib/map/footprint-circle'

export const CONSTRUCTION_3D_LAYER_ID = 'sv-construction-3d'
const MAX_MESHES = 48
/** Match Map3D DETAIL_ZOOM — extrusion/cluster handoff. */
const DETAIL_MIN_ZOOM = 13.5

export type Construction3DApi = {
  /** Rebuild meshes; resolves with textured building ids. */
  sync: (buildings: MapBuildingCluster[]) => Promise<Set<string>>
  texturedIds: () => Set<string>
  setMinZoom: (z: number) => void
  remove: () => void
}

type ThreeNS = typeof import('three')
type Object3D = InstanceType<ThreeNS['Object3D']>

type LayerState = {
  map: MlMap
  THREE: ThreeNS
  camera: InstanceType<ThreeNS['Camera']>
  scene: InstanceType<ThreeNS['Scene']>
  renderer: InstanceType<ThreeNS['WebGLRenderer']>
  root: InstanceType<ThreeNS['Group']>
  meshes: Map<string, Object3D>
  textured: Set<string>
  origin: { lat: number; lng: number }
  loader: InstanceType<ThreeNS['TextureLoader']>
  gltfLoader: import('three/examples/jsm/loaders/GLTFLoader.js').GLTFLoader | null
  /** Match MapLibre extrusion minzoom — never draw over cluster digits. */
  minZoom: number
}

function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  if (typeof window === 'undefined') return url
  return new URL(url, window.location.origin).href
}

function isGltf(url: string): boolean {
  return /\.(glb|gltf)(\?|#|$)/i.test(url)
}

/** Closed ring → local meters east/north relative to centroid. */
export function ringToLocalEN(
  ring: [number, number][],
  originLat: number,
  originLng: number,
): { x: number; y: number }[] {
  const mPerDegLat = 111_320
  const mPerDegLng = 111_320 * Math.cos((originLat * Math.PI) / 180)
  const out: { x: number; y: number }[] = []
  const last = ring.length - 1
  const closed =
    last > 0 && ring[0]![0] === ring[last]![0] && ring[0]![1] === ring[last]![1]
  const end = closed ? last : ring.length
  for (let i = 0; i < end; i++) {
    const [lng, lat] = ring[i]!
    out.push({
      x: (lng - originLng) * mPerDegLng,
      y: (lat - originLat) * mPerDegLat,
    })
  }
  return out
}

export function ringPerimeterM(pts: { x: number; y: number }[]): number {
  let p = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!
    const b = pts[(i + 1) % pts.length]!
    p += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return p
}

/** Cylindrical facade UVs after ExtrudeGeometry + rotateX(-90). Roof stays quiet. */
export function facadeUV(
  x: number,
  y: number,
  z: number,
  ny: number,
  heightM: number,
): [number, number] {
  if (Math.abs(ny) > 0.55) return [0.5, 0.98]
  const u = Math.atan2(x, z) / (Math.PI * 2) + 0.5
  const v = Math.min(1, Math.max(0, y / Math.max(heightM, 1)))
  return [u, v]
}

function mercatorTransform(
  THREE: ThreeNS,
  lat: number,
  lng: number,
): InstanceType<ThreeNS['Matrix4']> {
  const mc = maplibregl.MercatorCoordinate.fromLngLat({ lat, lng }, 0)
  const s = mc.meterInMercatorCoordinateUnits()
  const rotateX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
  return new THREE.Matrix4()
    .makeTranslation(mc.x, mc.y, mc.z)
    .scale(new THREE.Vector3(s, -s, s))
    .multiply(rotateX)
}

function loadTexture(
  loader: InstanceType<ThreeNS['TextureLoader']>,
  url: string,
): Promise<InstanceType<ThreeNS['Texture']>> {
  return new Promise((resolve, reject) => {
    loader.load(absoluteUrl(url), resolve, undefined, reject)
  })
}

/** Await texture first — sync loader.load left meshes black while MapLibre was already hidden. */
async function makeExtrudedMesh(
  THREE: ThreeNS,
  loader: InstanceType<ThreeNS['TextureLoader']>,
  ring: [number, number][],
  lat: number,
  lng: number,
  heightM: number,
  imgUrl: string,
): Promise<InstanceType<ThreeNS['Mesh']>> {
  const pts = ringToLocalEN(ring, lat, lng)
  if (pts.length < 3) throw new Error('ring too short')
  const shape = new THREE.Shape()
  shape.moveTo(pts[0]!.x, pts[0]!.y)
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i]!.x, pts[i]!.y)
  shape.closePath()

  const height = Math.max(heightM, 8)
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  })
  // Shape XY = east/north, depth +Z → rotate so +Y is up (MapLibre three.js convention)
  geom.rotateX(-Math.PI / 2)
  geom.computeVertexNormals()
  const pos = geom.attributes.position
  const nrm = geom.attributes.normal
  const uv = geom.attributes.uv
  if (pos && nrm && uv) {
    for (let i = 0; i < pos.count; i++) {
      const [u, v] = facadeUV(pos.getX(i), pos.getY(i), pos.getZ(i), nrm.getY(i), height)
      uv.setXY(i, u, v)
    }
    uv.needsUpdate = true
  }

  const tex = await loadTexture(loader, imgUrl)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.anisotropy = 8
  const img = tex.image as { width?: number; height?: number } | undefined
  const aspect =
    img?.width && img?.height ? img.width / img.height : 0.7
  const copies = Math.min(
    6,
    Math.max(1, Math.round(ringPerimeterM(pts) / (height * aspect))),
  )
  tex.repeat.set(copies, 1)

  // BasicMaterial: no light dependency; Standard + empty map → black boxes.
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
  })
  return new THREE.Mesh(geom, mat)
}

async function makeCylinderMesh(
  THREE: ThreeNS,
  loader: InstanceType<ThreeNS['TextureLoader']>,
  radiusM: number,
  heightM: number,
  imgUrl: string,
): Promise<InstanceType<ThreeNS['Mesh']>> {
  const geom = new THREE.CylinderGeometry(radiusM, radiusM, Math.max(heightM, 8), 32)
  const tex = await loadTexture(loader, imgUrl)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
  const mesh = new THREE.Mesh(geom, mat)
  mesh.position.y = Math.max(heightM, 8) / 2
  return mesh
}

function disposeObject(obj: Object3D) {
  obj.traverse((child) => {
    const mesh = child as InstanceType<ThreeNS['Mesh']>
    if (mesh.geometry) mesh.geometry.dispose()
    const mats = mesh.material
    if (!mats) return
    for (const m of Array.isArray(mats) ? mats : [mats]) {
      const mat = m as InstanceType<ThreeNS['MeshStandardMaterial']>
      mat.map?.dispose()
      mat.dispose()
    }
  })
}

function disposeState(state: LayerState | null) {
  if (!state) return
  for (const obj of state.meshes.values()) {
    state.root.remove(obj)
    disposeObject(obj)
  }
  state.meshes.clear()
  state.textured.clear()
  state.renderer.dispose()
}

async function applySync(state: LayerState, buildings: MapBuildingCluster[]) {
  for (const [, obj] of state.meshes) {
    state.root.remove(obj)
    disposeObject(obj)
  }
  state.meshes.clear()
  state.textured.clear()

  let n = 0
  for (const b of buildings) {
    if (n >= MAX_MESHES) break
    if (b.status !== 'construction' || b.listings.length > 0 || !b.img) continue
    const rings = clusterRings(b)
    if (rings.length === 0) continue
    // ponytail: MapLibre 64-gon fill-extrusion reads as cylinders; photo-wrap three.js hid them behind wrong massing.
    if (rings.every((r) => r.circular && r.radiusM)) continue

    n++
    const fallbackH = b.heightM > 0 ? b.heightM : Math.max(8, (b.floors ?? 8) * 3.15)
    const url = b.img

    try {
      let obj: Object3D
      if (isGltf(url)) {
        if (!state.gltfLoader) {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
          state.gltfLoader = new GLTFLoader()
        }
        const gltf = await state.gltfLoader.loadAsync(absoluteUrl(url))
        obj = gltf.scene
      } else {
        const group = new state.THREE.Group()
        for (const part of rings) {
          const height = part.floors
            ? Math.min(part.floors * 3.15, 350)
            : fallbackH
          const cen = ringCentroid(part.ring)
          const mesh =
            part.circular && part.radiusM
              ? await makeCylinderMesh(state.THREE, state.loader, part.radiusM, height, url)
              : await makeExtrudedMesh(
                  state.THREE,
                  state.loader,
                  part.ring,
                  cen.lat,
                  cen.lng,
                  height,
                  url,
                )
          const en = ringToLocalEN(
            [[cen.lng, cen.lat]],
            state.origin.lat,
            state.origin.lng,
          )[0]!
          mesh.position.x += en.x
          mesh.position.z += -en.y
          group.add(mesh)
        }
        obj = group
      }

      state.root.add(obj)
      state.meshes.set(b.id, obj)
      state.textured.add(b.id)
    } catch (err) {
      console.warn('[construction-3d]', b.id, err)
    }
  }
}

export function ensureConstruction3D(map: MlMap): Construction3DApi {
  const bag = map as unknown as { __svConstruction3D?: Construction3DApi }
  if (map.getLayer(CONSTRUCTION_3D_LAYER_ID) && bag.__svConstruction3D) {
    return bag.__svConstruction3D
  }

  let state: LayerState | null = null
  let syncQueue: MapBuildingCluster[] | null = null
  let readyResolvers: Array<() => void> = []
  let pendingMinZoom = DETAIL_MIN_ZOOM

  function waitReady(): Promise<void> {
    if (state) return Promise.resolve()
    return new Promise((resolve) => {
      readyResolvers.push(resolve)
    })
  }

  const api: Construction3DApi = {
    texturedIds: () => state?.textured ?? new Set(),
    setMinZoom(z) {
      pendingMinZoom = z
      if (state) state.minZoom = z
    },
    async sync(buildings) {
      if (!state) syncQueue = buildings
      await waitReady()
      if (!state) return new Set()
      state.minZoom = pendingMinZoom
      await applySync(state, buildings)
      map.triggerRepaint()
      return new Set(state.textured)
    },
    remove() {
      try {
        if (map.getLayer(CONSTRUCTION_3D_LAYER_ID)) map.removeLayer(CONSTRUCTION_3D_LAYER_ID)
      } catch {
        /* gone */
      }
      disposeState(state)
      state = null
      delete bag.__svConstruction3D
    },
  }

  const layer: CustomLayerInterface = {
    id: CONSTRUCTION_3D_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',
    async onAdd(mapInst, gl) {
      const THREE = await import('three')
      const camera = new THREE.Camera()
      const scene = new THREE.Scene()
      const root = new THREE.Group()
      scene.add(root)
      scene.add(new THREE.AmbientLight(0xffffff, 1.15))
      const sun = new THREE.DirectionalLight(0xffffff, 0.55)
      sun.position.set(40, 80, 20)
      scene.add(sun)

      const renderer = new THREE.WebGLRenderer({
        canvas: mapInst.getCanvas(),
        context: gl as WebGLRenderingContext,
        antialias: true,
      })
      renderer.autoClear = false
      renderer.outputColorSpace = THREE.SRGBColorSpace

      state = {
        map: mapInst,
        THREE,
        camera,
        scene,
        renderer,
        root,
        meshes: new Map(),
        textured: new Set(),
        origin: { lat: MAP_CENTER.lat, lng: MAP_CENTER.lng },
        loader: new THREE.TextureLoader(),
        gltfLoader: null,
        minZoom: pendingMinZoom,
      }
      const queued = readyResolvers
      readyResolvers = []
      for (const r of queued) r()
      if (syncQueue) {
        await applySync(state, syncQueue)
        syncQueue = null
        mapInst.triggerRepaint()
      }
    },
    render(_gl, args: CustomRenderMethodInput) {
      if (!state) return
      // ponytail: custom layers ignore minzoom — gate here or meshes cover cluster counts.
      if (state.map.getZoom() < state.minZoom || state.map.getPitch() < 1) return
      const { THREE, camera, scene, renderer, origin } = state
      const m = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix)
      const l = mercatorTransform(THREE, origin.lat, origin.lng)
      camera.projectionMatrix = m.multiply(l)
      renderer.resetState()
      renderer.render(scene, camera)
    },
    onRemove() {
      disposeState(state)
      state = null
    },
  }

  const before = map.getLayer('sivrce-buildings-label')
    ? 'sivrce-buildings-label'
    : map.getLayer('sivrce-buildings-3d')
      ? 'sivrce-buildings-3d'
      : undefined
  if (!map.getLayer(CONSTRUCTION_3D_LAYER_ID)) {
    map.addLayer(layer, before)
  }
  bag.__svConstruction3D = api
  return api
}

/** Ensure layer + sync meshes. Call after style reload / buildings change. */
export function syncConstructionRenders(
  map: MlMap,
  _buildings: MapBuildingCluster[],
  opts?: { minZoom?: number; beforeId?: string },
): Promise<Set<string>> {
  // ponytail: photo-wrap off — MapLibre TAS/OSM extrusion is the future massing.
  // Ceiling: marketing façade wraps. Upgrade: call ensureConstruction3D + api.sync again
  // (or GLB-only) when product wants 1:1 renders back.
  const bag = map as unknown as { __svConstruction3D?: Construction3DApi }
  if (bag.__svConstruction3D) bag.__svConstruction3D.remove()
  void opts
  return Promise.resolve(new Set())
}
