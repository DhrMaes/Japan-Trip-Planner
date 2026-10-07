import { useState } from 'react'
import { ArrowRight, Check, FileUp, Pencil, Plus, Ticket, Trash2, X } from 'lucide-react'
import { STORAGE_KEYS, useLocalStorage } from '../../hooks/useLocalStorage.js'
import { extractDocumentText, extractTransportFields } from './documentImport.js'

const blank = { type: 'train', date: '', from: '', to: '', departure: '', arrival: '', reservation: '', ticket: '', notes: '' }

export default function TransportPanel() {
  const [records, setRecords] = useLocalStorage(STORAGE_KEYS.transport, [])
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [importStatus, setImportStatus] = useState('')

  function addRecord(event) {
    event.preventDefault()
    if (![form.from, form.to, form.reservation, form.ticket, form.notes].some((value) => value.trim())) return
    setRecords((current) => [...current, { ...form, id: crypto.randomUUID() }].sort((a, b) => a.date.localeCompare(b.date)))
    setForm(blank)
  }

  function startEditing(record) {
    setEditingId(record.id)
    setForm({ ...blank, ...record })
    setImportStatus('')
  }

  function cancelEditing() {
    setEditingId(null)
    setForm(blank)
  }

  function saveEdit(event) {
    event.preventDefault()
    if (![form.from, form.to, form.reservation, form.ticket, form.notes].some((value) => value.trim())) return
    setRecords((current) => current.map((record) => record.id === editingId ? { ...form, id: editingId } : record).sort((a, b) => a.date.localeCompare(b.date)))
    cancelEditing()
  }

  async function importDocument(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportStatus('Reading document...')
    try {
      const text = await extractDocumentText(file, (progress) => setImportStatus(`Reading image... ${Math.round(progress * 100)}%`))
      setForm((current) => ({ ...current, ...extractTransportFields(text) }))
      setImportStatus('Fields imported. Please check them before saving.')
    } catch (error) {
      setImportStatus(error.message || 'Could not read this document.')
    }
  }

  return (
    <div className="tool-layout">
      <section className="tool-content"><div className="section-heading"><div><p className="eyebrow">On the move</p><h2>Flights, trains & JR Pass</h2></div><span>{records.length} saved</span></div>
        <div className="record-list">
          {!records.length && <div className="tool-empty"><Ticket size={25} /><p>Add a flight, train, Shinkansen ticket, or JR Pass detail.</p></div>}
          {records.map((record) => editingId === record.id ? <form className="transport-edit-form" key={record.id} onSubmit={saveEdit}>
            <div className="form-pair"><label><span>Type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="flight">Flight</option><option value="train">Train</option><option value="shinkansen">Shinkansen</option><option value="jr-pass">JR Pass</option></select></label><label><span>Date</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label></div>
            <div className="form-pair"><label><span>From</span><input value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} /></label><label><span>To</span><input value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} /></label></div>
            <div className="form-pair"><label><span>Departure</span><input type="time" value={form.departure} onChange={(event) => setForm({ ...form, departure: event.target.value })} /></label><label><span>Arrival</span><input type="time" value={form.arrival} onChange={(event) => setForm({ ...form, arrival: event.target.value })} /></label></div>
            <label><span>Reservation number</span><input value={form.reservation} onChange={(event) => setForm({ ...form, reservation: event.target.value })} /></label><label><span>Ticket / carriage / seat</span><input value={form.ticket} onChange={(event) => setForm({ ...form, ticket: event.target.value })} /></label><label><span>Notes</span><textarea rows="2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
            <div className="edit-actions"><button className="primary-button" type="submit"><Check size={16} /> Save changes</button><button className="icon-button" type="button" title="Cancel editing" onClick={cancelEditing}><X size={18} /></button></div>
          </form> : <article className="transport-record" key={record.id}>
            <div className="record-badge">{record.type}</div><div className="route"><strong>{record.from || 'Origin'}</strong><ArrowRight size={17} /><strong>{record.to || 'Destination'}</strong><span>{record.date || 'Date not set'} · {record.departure || '--:--'} – {record.arrival || '--:--'}</span></div>
            <div className="record-meta"><span>Reservation</span><b>{record.reservation || '—'}</b><span>Ticket / seat</span><b>{record.ticket || '—'}</b>{record.notes && <p>{record.notes}</p>}</div>
            <div className="record-actions"><button className="icon-button" title="Edit transport" onClick={() => startEditing(record)}><Pencil size={16} /></button><button className="icon-button danger" title="Delete transport" onClick={() => setRecords((current) => current.filter((item) => item.id !== record.id))}><Trash2 size={16} /></button></div>
          </article>)}
        </div>
      </section>
      <aside className="tool-form-panel"><p className="eyebrow">New journey</p><h2>Add transport</h2>
        <label className="document-upload"><span>Import from PDF or image</span><input type="file" accept="application/pdf,image/*" onChange={importDocument} /><span className="upload-button"><FileUp size={16} /> Choose file</span></label>
        {importStatus && <p className="import-status" aria-live="polite">{importStatus}</p>}
        <form onSubmit={addRecord}>
        <label><span>Type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="flight">Flight</option><option value="train">Train</option><option value="shinkansen">Shinkansen</option><option value="jr-pass">JR Pass</option></select></label>
        <label><span>Date</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
        <div className="form-pair"><label><span>From</span><input value={form.from} placeholder="Tokyo" onChange={(event) => setForm({ ...form, from: event.target.value })} /></label><label><span>To</span><input value={form.to} placeholder="Kyoto" onChange={(event) => setForm({ ...form, to: event.target.value })} /></label></div>
        <div className="form-pair"><label><span>Departure</span><input type="time" value={form.departure} onChange={(event) => setForm({ ...form, departure: event.target.value })} /></label><label><span>Arrival</span><input type="time" value={form.arrival} onChange={(event) => setForm({ ...form, arrival: event.target.value })} /></label></div>
        <label><span>Reservation number</span><input value={form.reservation} onChange={(event) => setForm({ ...form, reservation: event.target.value })} /></label>
        <label><span>Ticket / carriage / seat</span><input value={form.ticket} placeholder="Car 8, seat 12-A" onChange={(event) => setForm({ ...form, ticket: event.target.value })} /></label>
        <label><span>Notes</span><textarea rows="2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <button className="primary-button" type="submit"><Plus size={17} /> Save transport</button>
        </form></aside>
    </div>
  )
}