import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { createWorker } from 'tesseract.js'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()

function clean(value) {
  return value?.replace(/\s+/g, ' ').trim() || ''
}

function findValue(text, labels) {
  const labelPattern = labels.join('|')
  const match = text.match(new RegExp(`(?:${labelPattern})\\s*[:#-]?\\s*([^\\n|]+)`, 'i'))
  return clean(match?.[1])
}

function normalizeDate(value) {
  const match = value.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})|(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
  if (!match) return ''
  const [, year, month, day, dayFirst, monthFirst, yearLast] = match
  return `${year || yearLast}-${(month || monthFirst).padStart(2, '0')}-${(day || dayFirst).padStart(2, '0')}`
}

function normalizeTime(value) {
  const match = value.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : ''
}

export function extractTransportFields(text) {
  const lines = text.split(/\n|\r/).map(clean).filter(Boolean)
  const route = text.match(/(?:from|departure)\s*[:#-]?\s*([^\n]+?)\s+(?:to|arrival)\s*[:#-]?\s*([^\n]+)/i)
  const dateText = findValue(text, ['date', 'travel date', 'departure date']) || text
  const departureText = findValue(text, ['departure', 'depart', 'departure time']) || text
  const arrivalText = findValue(text, ['arrival', 'arrive', 'arrival time']) || text
  return {
    type: /flight|airline|boarding/i.test(text) ? 'flight' : /shinkansen/i.test(text) ? 'shinkansen' : 'train',
    date: normalizeDate(dateText),
    from: clean(route?.[1] || findValue(text, ['from', 'origin', 'departure station'])),
    to: clean(route?.[2] || findValue(text, ['to', 'destination', 'arrival station'])),
    departure: normalizeTime(departureText),
    arrival: normalizeTime(arrivalText),
    reservation: findValue(text, ['reservation', 'booking reference', 'confirmation', 'reservation number']),
    ticket: findValue(text, ['ticket', 'seat', 'carriage', 'coach']),
    notes: lines.slice(0, 2).join(' · '),
  }
}

export function extractStayFields(text) {
  const lines = text.split(/\n|\r/).map(clean).filter(Boolean)
  const dateMatches = [...text.matchAll(/(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/g)].map((match) => normalizeDate(match[0]))
  return {
    city: findValue(text, ['city', 'location', 'town']),
    hotel: findValue(text, ['hotel', 'property', 'accommodation', 'ชื่อโรงแรม']) || lines[0] || '',
    address: findValue(text, ['address', 'แอดเดรส']),
    checkIn: normalizeDate(findValue(text, ['check-in', 'check in', 'arrival']) || dateMatches[0] || ''),
    checkOut: normalizeDate(findValue(text, ['check-out', 'check out', 'departure']) || dateMatches[1] || ''),
    booking: findValue(text, ['booking', 'confirmation', 'reservation', 'booking number']),
    notes: lines.slice(1, 3).join(' · '),
  }
}

async function extractPdfText(file) {
  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise
  const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => {
    const page = await pdf.getPage(index + 1)
    const content = await page.getTextContent()
    return content.items.map((item) => item.str).join(' ')
  }))
  return pages.join('\n')
}

async function extractImageText(file, onProgress) {
  const worker = await createWorker('eng', 1, { logger: (message) => onProgress?.(message.progress || 0) })
  try {
    const { data } = await worker.recognize(file)
    return data.text
  } finally {
    await worker.terminate()
  }
}

export async function extractDocumentText(file, onProgress) {
  if (file.type === 'application/pdf') return extractPdfText(file)
  if (file.type.startsWith('image/')) return extractImageText(file, onProgress)
  throw new Error('Upload a PDF or image file.')
}