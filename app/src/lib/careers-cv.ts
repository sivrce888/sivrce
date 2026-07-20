/**
 * Careers CV kind detection — magic bytes + extension.
 * Run check: npx tsx src/lib/careers-cv.check.ts
 */

export type CvKind = 'pdf' | 'doc' | 'docx'

const PDF = Buffer.from('%PDF')
const OLE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]) // .doc
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]) // .docx (OOXML zip)

export function cvExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m?.[1] ?? ''
}

/** Detect CV kind from buffer + filename. Null = reject. */
export function detectCvKind(buf: Buffer, filename: string): CvKind | null {
  const ext = cvExt(filename)
  if (buf.length >= 4 && buf.subarray(0, 4).equals(PDF) && (ext === 'pdf' || ext === '')) return 'pdf'
  if (buf.length >= 4 && buf.subarray(0, 4).equals(OLE) && (ext === 'doc' || ext === '')) return 'doc'
  // docx is a zip — require .docx so random zips don't pass
  if (buf.length >= 4 && buf.subarray(0, 4).equals(ZIP) && ext === 'docx') return 'docx'
  return null
}

export function cvContentType(kind: CvKind): string {
  switch (kind) {
    case 'pdf':
      return 'application/pdf'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}
