import { useState } from 'react'
import { ArrowDown, ArrowUp, BookOpen, CalendarDays, Lightbulb, List, MapPin, Plus, Trash2 } from 'lucide-react'
import { STORAGE_KEYS, useLocalStorage } from '../../hooks/useLocalStorage.js'
import DayJournal from './DayJournal.jsx'
import RegionIdeas from './RegionIdeas.jsx'

const initialItinerary = {
  days: [
    { id: crypto.randomUUID(), date: '', region: 'Tokyo', title: 'Arrival day', entries: [] },
  ],
}

function moveItem(items, index, direction) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const updated = [...items]
  ;[updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]]
  return updated
}

function formatDate(date) {
  if (!date) return 'Date not set'
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

function DayCard({ day, index, total, onUpdate, onDelete, onMove }) {
  function updateEntry(entryId, patch) {
    onUpdate({ entries: day.entries.map((entry) => entry.id === entryId ? { ...entry, ...patch } : entry) })
  }

  function addEntry() {
    onUpdate({ entries: [...day.entries, { id: crypto.randomUUID(), time: '', title: '', location: '', notes: '' }] })
  }

  function moveEntry(entryIndex, direction) {
    onUpdate({ entries: moveItem(day.entries, entryIndex, direction) })
  }

  return (
    <article className="day-card">
      <div className="day-number"><span>Day</span><strong>{index + 1}</strong></div>
      <div className="day-body">
        <div className="day-fields">
          <label><span>Date</span><input type="date" value={day.date} onChange={(event) => onUpdate({ date: event.target.value })} /></label>
          <label><span>City / region</span><input value={day.region} placeholder="e.g. Kyoto" onChange={(event) => onUpdate({ region: event.target.value })} /></label>
          <label className="day-title-field"><span>Day title</span><input value={day.title} placeholder="A short theme for the day" onChange={(event) => onUpdate({ title: event.target.value })} /></label>
          <div className="order-actions" aria-label={`Reorder day ${index + 1}`}>
            <button className="icon-button" disabled={index === 0} onClick={() => onMove(-1)} title="Move day up"><ArrowUp size={17} /></button>
            <button className="icon-button" disabled={index === total - 1} onClick={() => onMove(1)} title="Move day down"><ArrowDown size={17} /></button>
            <button className="icon-button danger" onClick={onDelete} title="Delete day"><Trash2 size={17} /></button>
          </div>
        </div>

        <div className="entries">
          {day.entries.length === 0 && <div className="empty-inline">No plans yet. Add your first stop.</div>}
          {day.entries.map((entry, entryIndex) => (
            <div className="entry-row" key={entry.id}>
              <input className="time-input" type="time" value={entry.time} aria-label="Time" onChange={(event) => updateEntry(entry.id, { time: event.target.value })} />
              <div className="entry-content">
                <input className="entry-title" value={entry.title} placeholder="What are you doing?" aria-label="Entry title" onChange={(event) => updateEntry(entry.id, { title: event.target.value })} />
                <div className="location-field"><MapPin size={14} /><input value={entry.location} placeholder="Location" aria-label="Location" onChange={(event) => updateEntry(entry.id, { location: event.target.value })} /></div>
                <textarea rows="2" value={entry.notes} placeholder="Notes, reservation details, train info..." aria-label="Notes" onChange={(event) => updateEntry(entry.id, { notes: event.target.value })} />
              </div>
              <div className="entry-actions">
                <button className="icon-button" disabled={entryIndex === 0} onClick={() => moveEntry(entryIndex, -1)} title="Move entry up"><ArrowUp size={15} /></button>
                <button className="icon-button" disabled={entryIndex === day.entries.length - 1} onClick={() => moveEntry(entryIndex, 1)} title="Move entry down"><ArrowDown size={15} /></button>
                <button className="icon-button danger" onClick={() => onUpdate({ entries: day.entries.filter((item) => item.id !== entry.id) })} title="Delete entry"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
        <button className="text-button" onClick={addEntry}><Plus size={16} /> Add plan</button>
        <label className="diary-field">
          <span>Day journal</span>
          <textarea rows="3" value={day.diary || ''} placeholder="What did you do today? Favorite moments, food, surprises..." onChange={(event) => onUpdate({ diary: event.target.value })} />
        </label>
      </div>
    </article>
  )
}

function TripOverview({ days }) {
  if (!days.length) return <div className="empty-state"><CalendarDays size={28} /><h2>No days planned</h2><p>Switch to Builder and add the first day of your trip.</p></div>

  return (
    <div className="overview-strip">
      {days.map((day, index) => (
        <article className="overview-day" key={day.id}>
          <div className="overview-marker">{index + 1}</div>
          <div className="overview-card">
            <p>{formatDate(day.date)}</p>
            <h2>{day.region || 'Region not set'}</h2>
            <span>{day.title || `${day.entries.length} planned ${day.entries.length === 1 ? 'stop' : 'stops'}`}</span>
            {day.entries.slice(0, 3).map((entry) => <div className="overview-entry" key={entry.id}><time>{entry.time || '--:--'}</time>{entry.title || 'Untitled plan'}</div>)}
            {day.entries.length > 3 && <small>+{day.entries.length - 3} more</small>}
          </div>
        </article>
      ))}
    </div>
  )
}

export default function ItineraryView() {
  const [itinerary, setItinerary] = useLocalStorage(STORAGE_KEYS.itinerary, initialItinerary)
  const [mode, setMode] = useState('journal')
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDayId, setSelectedDayId] = useState(() => itinerary.days.find((day) => day.date === today)?.id || itinerary.days[0]?.id || '')
  const ideas = itinerary.ideas || []
  const regions = [...new Set(itinerary.days.map((day) => day.region.trim()).filter(Boolean))]

  function updateDay(dayId, patch) {
    setItinerary((current) => ({ ...current, days: current.days.map((day) => day.id === dayId ? { ...day, ...patch } : day) }))
  }

  function addDay() {
    const previousDay = itinerary.days.at(-1)
    let nextDate = ''
    if (previousDay?.date) {
      const date = new Date(`${previousDay.date}T00:00:00Z`)
      date.setUTCDate(date.getUTCDate() + 1)
      nextDate = date.toISOString().slice(0, 10)
    }
    setItinerary((current) => ({ ...current, days: [...current.days, { id: crypto.randomUUID(), date: nextDate, region: previousDay?.region || '', title: '', diary: '', entries: [] }] }))
  }

  function deleteDay(dayId) {
    if (window.confirm('Delete this day and all its plans?')) {
      setItinerary((current) => ({ ...current, days: current.days.filter((day) => day.id !== dayId) }))
    }
  }

  return (
    <div className="feature-view">
      <div className="view-heading">
        <div><p className="eyebrow">Your route</p><h1>Itinerary</h1><p>{itinerary.days.length} {itinerary.days.length === 1 ? 'day' : 'days'} planned across Japan</p></div>
        <div className="heading-actions">
          <div className="segmented-control" aria-label="Itinerary view">
            <button className={mode === 'journal' ? 'active' : ''} onClick={() => setMode('journal')} title="Journal"><BookOpen size={16} /><span>Journal</span></button>
            <button className={mode === 'ideas' ? 'active' : ''} onClick={() => setMode('ideas')} title="Ideas by region"><Lightbulb size={16} /><span>Ideas</span></button>
            <button className={mode === 'builder' ? 'active' : ''} onClick={() => setMode('builder')}><List size={16} /> Builder</button>
            <button className={mode === 'overview' ? 'active' : ''} onClick={() => setMode('overview')}><CalendarDays size={16} /> Overview</button>
          </div>
          {mode === 'builder' && <button className="primary-button" onClick={addDay}><Plus size={17} /> Add day</button>}
        </div>
      </div>

      {mode === 'journal' ? <DayJournal days={itinerary.days} ideas={ideas} selectedDayId={selectedDayId} onSelectDay={setSelectedDayId} onUpdateDay={updateDay} /> : mode === 'ideas' ? <RegionIdeas ideas={ideas} regions={regions} onChange={(nextIdeas) => setItinerary((current) => ({ ...current, ideas: nextIdeas }))} /> : mode === 'overview' ? <TripOverview days={itinerary.days} /> : (
        <div className="day-list">
          {itinerary.days.map((day, index) => (
            <DayCard
              day={day}
              index={index}
              total={itinerary.days.length}
              key={day.id}
              onUpdate={(patch) => updateDay(day.id, patch)}
              onDelete={() => deleteDay(day.id)}
              onMove={(direction) => setItinerary((current) => ({ ...current, days: moveItem(current.days, index, direction) }))}
            />
          ))}
          {!itinerary.days.length && <div className="empty-state"><CalendarDays size={28} /><h2>Start your route</h2><p>Add a day to begin shaping the trip.</p><button className="primary-button" onClick={addDay}><Plus size={17} /> Add first day</button></div>}
        </div>
      )}
    </div>
  )
}