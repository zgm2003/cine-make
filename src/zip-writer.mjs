const ZIP_UTF8_FLAG = 0x0800
const STORE_METHOD = 0

const crcTable = new Uint32Array(256)
for (let index = 0; index < crcTable.length; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1)
  }
  crcTable[index] = value >>> 0
}

export function createStoredZip(entries) {
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error('createStoredZip requires at least one entry')
  }

  const seen = new Set()
  const localParts = []
  const centralParts = []
  let localOffset = 0

  for (const entry of entries) {
    const name = normalizeEntryName(entry?.name)
    if (seen.has(name)) throw new Error(`Duplicate zip entry: ${name}`)
    seen.add(name)

    const nameBuffer = Buffer.from(name, 'utf8')
    const data = toBuffer(entry.data)
    const crc = crc32(data)
    const localHeader = createLocalHeader({ nameBuffer, data, crc })
    const centralHeader = createCentralHeader({ nameBuffer, data, crc, localOffset })

    localParts.push(localHeader, nameBuffer, data)
    centralParts.push(centralHeader, nameBuffer)
    localOffset += localHeader.length + nameBuffer.length + data.length
  }

  const centralOffset = localOffset
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const end = createEndOfCentralDirectory({
    entryCount: entries.length,
    centralSize,
    centralOffset
  })

  return Buffer.concat([...localParts, ...centralParts, end])
}

function normalizeEntryName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Zip entry name must be a non-empty string')
  }
  const normalized = name.replace(/\\/gu, '/')
  if (normalized.startsWith('/')) throw new Error(`Zip entry must be relative: ${name}`)
  if (normalized.split('/').some((part) => part === '..')) {
    throw new Error(`Zip entry must not contain path traversal: ${name}`)
  }
  return normalized
}

function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data
  if (data instanceof Uint8Array) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  }
  if (typeof data === 'string') return Buffer.from(data, 'utf8')
  throw new Error('Zip entry data must be a string, Buffer, or Uint8Array')
}

function createLocalHeader({ nameBuffer, data, crc }) {
  const header = Buffer.alloc(30)
  header.writeUInt32LE(0x04034b50, 0)
  header.writeUInt16LE(20, 4)
  header.writeUInt16LE(ZIP_UTF8_FLAG, 6)
  header.writeUInt16LE(STORE_METHOD, 8)
  header.writeUInt16LE(0, 10)
  header.writeUInt16LE(0, 12)
  header.writeUInt32LE(crc, 14)
  header.writeUInt32LE(data.length, 18)
  header.writeUInt32LE(data.length, 22)
  header.writeUInt16LE(nameBuffer.length, 26)
  header.writeUInt16LE(0, 28)
  return header
}

function createCentralHeader({ nameBuffer, data, crc, localOffset }) {
  const header = Buffer.alloc(46)
  header.writeUInt32LE(0x02014b50, 0)
  header.writeUInt16LE(20, 4)
  header.writeUInt16LE(20, 6)
  header.writeUInt16LE(ZIP_UTF8_FLAG, 8)
  header.writeUInt16LE(STORE_METHOD, 10)
  header.writeUInt16LE(0, 12)
  header.writeUInt16LE(0, 14)
  header.writeUInt32LE(crc, 16)
  header.writeUInt32LE(data.length, 20)
  header.writeUInt32LE(data.length, 24)
  header.writeUInt16LE(nameBuffer.length, 28)
  header.writeUInt16LE(0, 30)
  header.writeUInt16LE(0, 32)
  header.writeUInt16LE(0, 34)
  header.writeUInt16LE(0, 36)
  header.writeUInt32LE(0, 38)
  header.writeUInt32LE(localOffset, 42)
  return header
}

function createEndOfCentralDirectory({ entryCount, centralSize, centralOffset }) {
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entryCount, 8)
  end.writeUInt16LE(entryCount, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(centralOffset, 16)
  end.writeUInt16LE(0, 20)
  return end
}

function crc32(data) {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}
