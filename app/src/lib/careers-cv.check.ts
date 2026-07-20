import { detectCvKind } from './careers-cv'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

assert(detectCvKind(Buffer.from('%PDF-1.4\n'), 'cv.pdf') === 'pdf', 'pdf')
assert(detectCvKind(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 1, 2]), 'cv.doc') === 'doc', 'doc')
assert(detectCvKind(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1]), 'cv.docx') === 'docx', 'docx')
assert(detectCvKind(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1]), 'hack.zip') === null, 'zip rejected')
assert(detectCvKind(Buffer.from('hello'), 'x.pdf') === null, 'fake pdf')

console.log('careers-cv.check: ok')
