import { useState } from 'react'
import { BedDouble, Check, FileUp, Link2, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
import { STORAGE_KEYS, useLocalStorage } from '../../hooks/useLocalStorage.js'
import { extractDocumentText, extractStayFields } from './documentImport.js'

const blank = { city: '', hotel: '', address: '', checkIn: '', checkOut: '', price: '', currency: 'JPY', booking: '', bookingUrl: '', notes: '' }

function formatStayPrice(stay) {
  const currency = stay.currency === 'EUR' ? 'EUR' : 'JPY'
  const locale = currency === 'EUR' ? 'nl-NL' : 'ja-JP'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(stay.price))
}

function getBookingHref(value) {
  if (!value?.trim()) return ''
  try {
    const url = new URL(value.trim().match(/^https?:\/\//i) ? value.trim() : `https://${value.trim()}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

function resizeStayPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this photo.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('This image format is not supported.'))
      image.onload = () => {
        const scale = Math.min(1, 1000 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.68))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function StaysPanel() {
  const [stays, setStays] = useLocalStorage(STORAGE_KEYS.stays, [])
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(blank)
  const [importStatus, setImportStatus] = useState('')
  const [photoError, setPhotoError] = useState('')

  async function uploadPhoto(event, setTarget, stayId = null) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setPhotoError('')
    if (!file) return
    try {
      if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
      const photo = await resizeStayPhoto(file)
      const existingPhotoSize = stays.filter((stay) => stay.id !== stayId).reduce((total, stay) => total + (stay.photo?.length || 0), 0)
      if (existingPhotoSize + photo.length > 2_500_000) throw new Error('Stay photos exceed the local storage allowance. Remove a photo or choose a smaller image.')
      setTarget((current) => ({ ...current, photo }))
    } catch (error) {
      setPhotoError(error.message || 'Could not add this photo.')
    }
  }

  function addStay(event) {
    event.preventDefault()
    if (!form.hotel.trim()) return
    setStays((current) => [...current, { ...form, id: crypto.randomUUID() }].sort((a, b) => a.checkIn.localeCompare(b.checkIn)))
    setForm(blank)
  }

  function startEditing(stay) {
    setEditingId(stay.id)
    setEditForm({ ...blank, ...stay })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditForm(blank)
  }

  function saveEdit(event) {
    event.preventDefault()
    if (!editForm.hotel.trim()) return
    setStays((current) => current.map((stay) => stay.id === editingId ? { ...editForm, id: editingId } : stay).sort((a, b) => a.checkIn.localeCompare(b.checkIn)))
    cancelEditing()
  }

  async function importDocument(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportStatus('Reading document...')
    try {
      const text = await extractDocumentText(file, (progress) => setImportStatus(`Reading image... ${Math.round(progress * 100)}%`))
      setForm((current) => ({ ...current, ...extractStayFields(text) }))
      setImportStatus('Fields imported. Please check them before saving.')
    } catch (error) {
      setImportStatus(error.message || 'Could not read this document.')
    }
  }

  return <div className="tool-layout"><section className="tool-content"><div className="section-heading"><div><p className="eyebrow">Home base</p><h2>Stays by city</h2></div><span>{stays.length} booked</span></div><div className="record-grid stay-record-grid">
    {!stays.length && <div className="tool-empty"><BedDouble size={25} /><p>Keep hotel details and booking numbers close at hand.</p></div>}
    {stays.map((stay) => editingId === stay.id ? <article className="stay-record" key={stay.id}><form className="stay-edit-form" onSubmit={saveEdit}>
      {editForm.photo && <div className="stay-photo-preview"><img src={editForm.photo} alt={`${editForm.hotel || 'Stay'} preview`} /><button className="icon-button danger" type="button" title="Remove stay photo" onClick={() => setEditForm({ ...editForm, photo: '' })}><Trash2 size={15} /></button></div>}
      <label><span>Photo (optional)</span><input type="file" accept="image/*" onChange={(event) => uploadPhoto(event, setEditForm, stay.id)} /></label>
      {photoError && <p className="form-error" role="alert">{photoError}</p>}
      <label><span>City</span><input value={editForm.city} onChange={(event) => setEditForm({ ...editForm, city: event.target.value })} /></label>
      <label><span>Hotel name</span><input required value={editForm.hotel} onChange={(event) => setEditForm({ ...editForm, hotel: event.target.value })} /></label>
      <label><span>Address</span><input value={editForm.address} onChange={(event) => setEditForm({ ...editForm, address: event.target.value })} /></label>
      <div className="form-pair"><label><span>Check-in</span><input type="date" value={editForm.checkIn} onChange={(event) => setEditForm({ ...editForm, checkIn: event.target.value })} /></label><label><span>Check-out</span><input type="date" value={editForm.checkOut} onChange={(event) => setEditForm({ ...editForm, checkOut: event.target.value })} /></label></div>
      <div className="form-pair"><label><span>Price (optional)</span><input type="number" min="0" step="0.01" value={editForm.price} onChange={(event) => setEditForm({ ...editForm, price: event.target.value })} /></label><label><span>Currency</span><select value={editForm.currency || 'JPY'} onChange={(event) => setEditForm({ ...editForm, currency: event.target.value })}><option value="JPY">JPY ¥</option><option value="EUR">EUR €</option></select></label></div>
      <label><span>Booking number</span><input value={editForm.booking} onChange={(event) => setEditForm({ ...editForm, booking: event.target.value })} /></label>
      <label><span>Booking link</span><input type="url" value={editForm.bookingUrl} placeholder="https://..." onChange={(event) => setEditForm({ ...editForm, bookingUrl: event.target.value })} /></label>
      <label><span>Notes</span><textarea rows="2" value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} /></label>
      <div className="edit-actions"><button className="primary-button" type="submit"><Check size={16} /> Save changes</button><button className="icon-button" type="button" title="Cancel editing" onClick={cancelEditing}><X size={18} /></button></div>
    </form></article> : <article className="stay-record" key={stay.id}>{stay.photo && <img className="stay-photo" src={stay.photo} alt={`${stay.hotel} in ${stay.city || 'Japan'}`} />}<div className="stay-record-info"><div className="stay-city">{stay.city || 'City not set'}</div><h3>{stay.hotel}</h3><p><MapPin size={14} />{stay.address || 'Address not set'}</p><div className="stay-dates"><span>Check-in<strong>{stay.checkIn || '—'}</strong></span><span>Check-out<strong>{stay.checkOut || '—'}</strong></span></div>{stay.price && <div className="booking-number"><span>Price</span><b>{formatStayPrice(stay)}</b></div>}<div className="booking-number"><span>Booking</span><b>{stay.booking || '—'}</b>{getBookingHref(stay.bookingUrl) && <a className="icon-button stay-booking-link" href={getBookingHref(stay.bookingUrl)} target="_blank" rel="noopener noreferrer" title="Open booking link" aria-label={`Open booking link for ${stay.hotel}`}><Link2 size={16} /></a>}</div>{stay.notes && <small>{stay.notes}</small>}</div><div className="record-actions stay-actions"><button className="icon-button" title="Edit stay" onClick={() => startEditing(stay)}><Pencil size={16} /></button><button className="icon-button danger" title="Delete stay" onClick={() => setStays((current) => current.filter((item) => item.id !== stay.id))}><Trash2 size={16} /></button></div></article>)}
  </div></section><aside className="tool-form-panel"><p className="eyebrow">New booking</p><h2>Add a stay</h2>
    <label className="document-upload"><span>Import from PDF or image</span><input type="file" accept="application/pdf,image/*" onChange={importDocument} /><span className="upload-button"><FileUp size={16} /> Choose file</span></label>
    {importStatus && <p className="import-status" aria-live="polite">{importStatus}</p>}
    <form onSubmit={addStay}>
    {form.photo && <div className="stay-photo-preview"><img src={form.photo} alt={`${form.hotel || 'Stay'} preview`} /><button className="icon-button danger" type="button" title="Remove stay photo" onClick={() => setForm({ ...form, photo: '' })}><Trash2 size={15} /></button></div>}
    <label><span>Photo (optional)</span><input type="file" accept="image/*" onChange={(event) => uploadPhoto(event, setForm)} /></label>
    {photoError && <p className="form-error" role="alert">{photoError}</p>}
    <label><span>City</span><input value={form.city} placeholder="Kanazawa" onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label><span>Hotel name</span><input required value={form.hotel} onChange={(event) => setForm({ ...form, hotel: event.target.value })} /></label><label><span>Address</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
    <div className="form-pair"><label><span>Check-in</span><input type="date" value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} /></label><label><span>Check-out</span><input type="date" value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} /></label></div>
    <div className="form-pair"><label><span>Price (optional)</span><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label><span>Currency</span><select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}><option value="JPY">JPY ¥</option><option value="EUR">EUR €</option></select></label></div>
    <label><span>Booking number</span><input value={form.booking} onChange={(event) => setForm({ ...form, booking: event.target.value })} /></label><label><span>Booking link</span><input type="url" value={form.bookingUrl} placeholder="https://..." onChange={(event) => setForm({ ...form, bookingUrl: event.target.value })} /></label><label><span>Notes</span><textarea rows="2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label><button className="primary-button" type="submit"><Plus size={17} /> Save stay</button>
  </form></aside></div>
}