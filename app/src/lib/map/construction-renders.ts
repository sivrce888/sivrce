/**
 * Construction 1:1 massing — MapLibre custom layer + three.js.
 * Footprint extrude textured with admin render (or GLB if URL ends .glb/.gltf).
 * ponytail: Cesium skipped (second engine); add when Google Photorealistic 3D Tiles needed.
 */

import maplibregl, {
  type CustomLayerInterface,
  type CustomRenderMethodInput,
  type Map as MlMap,
} from 'maplibre-gl'
import {
  MAP_CENTER,
  clusterGeometry,
  type MapBuildingCluster,
} from '@/lib/map/buildings'

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

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(heightM, 8),
    bevelEnabled: false,
  })
  // Shape XY = east/north, depth +Z → rotate so +Y is up (MapLibre three.js convention)
  geom.rotateX(-Math.PI / 2)

  const tex = await loadTexture(loader, imgUrl)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.repeat.set(1, 1)

  // BasicMaterial: no light dependency; Standard + empty map → black boxes.
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
  })
  return new THREE.Mesh(geom, mat)
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
    const ring = clusterGeometry(b).coordinates[0] as [number, number][] | undefined
    if (!ring || ring.length < 4) continue

    n++
    const height = b.heightM > 0 ? b.heightM : Math.max(8, (b.floors ?? 8) * 3.15)
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
        obj = await makeExtrudedMesh(
          state.THREE,
          state.loader,
          ring,
          b.lat,
          b.lng,
          height,
          url,
        )
      }

      // Meters east / up / south-from-north relative to fixed MAP_CENTER origin
      const en = ringToLocalEN([[b.lng, b.lat]], state.origin.lat, state.origin.lng)[0]!
      obj.position.set(en.x, 0, -en.y)
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
  buildings: MapBuildingCluster[],
  opts?: { minZoom?: number; beforeId?: string },
): Promise<Set<string>> {
  const api = ensureConstruction3D(map)
  if (opts?.minZoom != null) api.setMinZoom(opts.minZoom)
  return api.sync(buildings)
}
