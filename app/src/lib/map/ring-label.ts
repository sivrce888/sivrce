/**
 * Pole of inaccessibility — center of the largest circle inside the ring
 * (Mapbox label point). Vertex averages fall into courtyard notches or outside
 * L-wings; this never leaves the walls. Equirectangular meters (building-scale
 * rings), ~0.25 m precision — sub-pixel at every zoom the embeds use.
 */
export function ringLabelPoint(
  ring: [number, number][],
): { lat: number; lng: number } {
  const last = ring.length - 1
  const closed =
    last > 0 && ring[0]![0] === ring[last]![0] && ring[0]![1] === ring[last]![1]
  const open = (closed ? ring.slice(0, last) : ring.slice()) as [number, number][]
  if (open.length < 3) {
    let lat = 0
    let lng = 0
    for (const [x, y] of open) {
      lng += x
      lat += y
    }
    const n = Math.max(open.length, 1)
    return { lat: lat / n, lng: lng / n }
  }
  const kx = 111_320 * Math.cos((open[0]![1] * Math.PI) / 180)
  const poly: [number, number][] = open.map(([lng, lat]) => [lng * kx, lat * 111_320])
  const segDist2 = (
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): number => {
    const dx = bx - ax
    const dy = by - ay
    const t =
      dx || dy
        ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        : 0
    const ex = ax + t * dx - px
    const ey = ay + t * dy - py
    return ex * ex + ey * ey
  }
  // Signed distance: positive inside, negative out.
  const dist = (px: number, py: number): number => {
    let best2 = Infinity
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const ax = poly[j]![0]
      const ay = poly[j]![1]
      const bx = poly[i]![0]
      const by = poly[i]![1]
      best2 = Math.min(best2, segDist2(px, py, ax, ay, bx, by))
      if ((ay > py) !== (by > py) && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) {
        inside = !inside
      }
    }
    return Math.sqrt(best2) * (inside ? 1 : -1)
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let sx = 0
  let sy = 0
  for (const [x, y] of poly) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
    sx += x
    sy += y
  }
  const size = Math.max(maxX - minX, maxY - minY)
  if (size <= 0) return { lat: open[0]![1], lng: open[0]![0] }
  // Seed at the vertex average — already optimal for the convex rings most
  // footprints are, so the grid refines in a handful of steps.
  let bx = sx / poly.length
  let by = sy / poly.length
  let bestD = dist(bx, by)
  type Cell = { x: number; y: number; h: number; max: number }
  const queue: Cell[] = []
  const h0 = size / 2
  for (let x = minX; x < maxX; x += h0 * 2) {
    for (let y = minY; y < maxY; y += h0 * 2) {
      const cx = x + h0
      const cy = y + h0
      queue.push({ x: cx, y: cy, h: h0, max: dist(cx, cy) + h0 * Math.SQRT2 })
    }
  }
  while (queue.length > 0) {
    let bi = 0
    for (let i = 1; i < queue.length; i++) {
      if (queue[i]!.max > queue[bi]!.max) bi = i
    }
    const cell = queue.splice(bi, 1)[0]!
    if (cell.max <= bestD + 0.25) continue
    const d = dist(cell.x, cell.y)
    if (d > bestD) {
      bestD = d
      bx = cell.x
      by = cell.y
    }
    const h = cell.h / 2
    for (const [dx, dy] of [
      [-h, -h],
      [h, -h],
      [-h, h],
      [h, h],
    ]) {
      const cx = cell.x + dx
      const cy = cell.y + dy
      queue.push({ x: cx, y: cy, h, max: dist(cx, cy) + h * Math.SQRT2 })
    }
  }
  return { lat: by / 111_320, lng: bx / kx }
}
