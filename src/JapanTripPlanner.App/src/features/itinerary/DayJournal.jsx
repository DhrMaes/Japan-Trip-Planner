import { useEffect, useRef, useState } from 'react'
import { Camera, Check, ImagePlus, Lightbulb, MapPin, Plus, Trash2, X } from 'lucide-react'

const defaultSuggestionImage = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80'
const suggestionImages = {
  'temples & shrines': 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=900&q=80',
  streetfood: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80',
  restaurants: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
  shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
  activiteiten: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80',
  nature: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80',
  wijken: defaultSuggestionImage,
  nightlife: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80',
}

function normalizePlace(value) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function metadataText(value) {
  return new DOMParser().parseFromString(value || '', 'text/html').body.textContent.trim()
}

async function fetchCommonsPhoto(query, signal) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: '1',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
    iiurlwidth: '300',
  })
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal })
  if (!response.ok) return null
  const data = await response.json()
  const page = Object.values(data.query?.pages || {})[0]
  const image = page?.imageinfo?.[0]
  if (!image?.thumburl || !image.descriptionurl) return null

  return {
    thumbnail: image.thumburl,
    descriptionUrl: image.descriptionurl,
    artist: metadataText(image.extmetadata?.Artist?.value),
    license: metadataText(image.extmetadata?.LicenseShortName?.value),
  }
}

function formatDay(date, options) {
  if (!date) return 'Date not set'
  const parsedDate = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsedDate.getTime())) return 'Date not set'
  return new Intl.DateTimeFormat('en', { ...options, timeZone: 'UTC' }).format(parsedDate)
}

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this photo.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('This image format is not supported.'))
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function DayJournal({ days, ideas, selectedDayId, onSelectDay, onUpdateDay }) {
  const [showComposer, setShowComposer] = useState(false)
  const [draft, setDraft] = useState({ time: '', title: '', location: '', notes: '' })
  const [photoError, setPhotoError] = useState('')
  const [commonsPhotoState, setCommonsPhotoState] = useState({ key: '', photos: {} })
  const fileInputRef = useRef(null)
  const selectedDay = days.find((day) => day.id === selectedDayId) || days[0]
  const entries = selectedDay?.entries || []
  const photos = selectedDay?.photos || []
  const matchingIdeas = selectedDay ? ideas.filter((idea) => idea.region.trim().toLowerCase() === selectedDay.region.trim().toLowerCase()) : []
  const normalizedDayTitle = ` ${normalizePlace(selectedDay?.title || '')} `
  const titleMatchedIdeas = matchingIdeas.filter((idea) => {
    const neighborhood = idea.location?.trim().split(/\s*[·,|]\s*/)[0] || ''
    const normalizedNeighborhood = normalizePlace(neighborhood)
    return normalizedNeighborhood && normalizedDayTitle.includes(` ${normalizedNeighborhood} `)
  })
  const selectedNeighborhoods = [...new Set(titleMatchedIdeas.map((idea) => idea.location.trim().split(/\s*[·,|]\s*/)[0]))]
  const suggestedIdeas = titleMatchedIdeas.length
    ? matchingIdeas.filter((idea) => !idea.location?.trim() || titleMatchedIdeas.some((match) => normalizePlace(match.location.trim().split(/\s*[·,|]\s*/)[0]) === normalizePlace(idea.location.trim().split(/\s*[·,|]\s*/)[0])))
    : matchingIdeas
  const suggestionSearchKey = JSON.stringify(suggestedIdeas.map((idea) => ({
    id: idea.id,
    query: [idea.title, idea.location || selectedDay?.title, idea.region, 'Japan'].filter(Boolean).join(' '),
  })))
  const usedIdeaIds = new Set(entries.map((entry) => entry.sourceIdeaId).filter(Boolean))

  useEffect(() => {
    const controller = new AbortController()
    const searches = JSON.parse(suggestionSearchKey)
    Promise.all(searches.map(async ({ id, query }) => [id, await fetchCommonsPhoto(query, controller.signal)]))
      .then((results) => {
        if (!controller.signal.aborted) setCommonsPhotoState({ key: suggestionSearchKey, photos: Object.fromEntries(results.filter(([, photo]) => photo)) })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') console.error('Could not load Commons photos.', error)
      })
    return () => controller.abort()
  }, [suggestionSearchKey])
  const commonsPhotos = commonsPhotoState.key === suggestionSearchKey ? commonsPhotoState.photos : {}

  if (!selectedDay) return <div className="empty-state"><Camera size={28} /><h2>Your journal starts with a day</h2><p>Open Planner and add the first day of your trip.</p></div>

  function updateEntry(entryId, patch) {
    onUpdateDay(selectedDay.id, { entries: entries.map((entry) => entry.id === entryId ? { ...entry, ...patch } : entry) })
  }

  function addIdea(idea, done = false) {
    if (usedIdeaIds.has(idea.id)) return
    onUpdateDay(selectedDay.id, { entries: [...entries, { id: crypto.randomUUID(), time: '', title: idea.title, location: idea.location, notes: idea.notes, done, sourceIdeaId: idea.id }] })
  }

  function addActivity(event) {
    event.preventDefault()
    if (!draft.title.trim()) return
    onUpdateDay(selectedDay.id, { entries: [...entries, { ...draft, id: crypto.randomUUID(), title: draft.title.trim(), done: false }] })
    setDraft({ time: '', title: '', location: '', notes: '' })
    setShowComposer(false)
  }

  async function addPhotos(event) {
    const files = [...event.target.files]
    event.target.value = ''
    setPhotoError('')
    if (photos.length + files.length > 8) {
      setPhotoError('Keep up to 8 photos per day so local browser storage stays reliable.')
      return
    }
    try {
      const nextPhotos = await Promise.all(files.map(async (file) => ({ id: crypto.randomUUID(), name: file.name, dataUrl: await resizePhoto(file), caption: '' })))
      const totalPhotoSize = [...photos, ...nextPhotos].reduce((total, photo) => total + photo.dataUrl.length, 0)
      if (totalPhotoSize > 3_500_000) throw new Error('These photos exceed the local storage allowance. Remove a photo or choose smaller files.')
      onUpdateDay(selectedDay.id, { photos: [...photos, ...nextPhotos] })
    } catch (error) {
      setPhotoError(error.message)
    }
  }

  return (
    <div className="journal-view">
      <div className="journal-day-strip" aria-label="Choose journal day">
        {days.map((day, index) => (
          <button className={day.id === selectedDay.id ? 'active' : ''} key={day.id} onClick={() => onSelectDay(day.id)}>
            <span>Day {index + 1}</span><strong>{day.date ? formatDay(day.date, { weekday: 'short', day: 'numeric' }) : day.region || 'Unscheduled'}</strong>
          </button>
        ))}
      </div>

      <article className="journal-paper">
        <header className="journal-header">
          <div><p className="eyebrow">{formatDay(selectedDay.date, { weekday: 'long', month: 'long', day: 'numeric' })}</p><h2>{selectedDay.title || selectedDay.region || 'A day in Japan'}</h2><span><MapPin size={14} />{selectedDay.region || 'Region not set'}</span></div>
          <div className="journal-quick-actions">
            <button className={showComposer ? 'round-action active' : 'round-action'} title="Add something we did" onClick={() => setShowComposer(!showComposer)}>{showComposer ? <X size={19} /> : <Plus size={19} />}</button>
            <button className="round-action" title="Add photos" onClick={() => fileInputRef.current?.click()}><ImagePlus size={19} /></button>
            <input ref={fileInputRef} className="hidden-file-input" type="file" accept="image/*" multiple onChange={addPhotos} />
          </div>
        </header>

        {showComposer && <form className="moment-composer" onSubmit={addActivity}>
          <div className="form-pair"><label><span>Time</span><input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label><label><span>What did you do?</span><input autoFocus required value={draft.title} placeholder="Found a tiny record shop" onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label></div>
          <label><span>Location</span><input value={draft.location} placeholder="Neighborhood or place" onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label>
          <label><span>Memory / note</span><textarea rows="2" value={draft.notes} placeholder="What made it memorable?" onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
          <button className="primary-button" type="submit"><Plus size={16} /> Add to today</button>
        </form>}

        <section className="today-section">
          <div className="journal-section-title"><div><p className="eyebrow">Today</p><h3>What we did</h3></div><span>{entries.filter((entry) => entry.done).length}/{entries.length} done</span></div>
          {!entries.length && <p className="journal-empty">Nothing recorded yet. Tap <Plus size={13} /> when the day unfolds, or pick an idea below.</p>}
          <div className="journal-entries">
            {entries.map((entry) => <div className={entry.done ? 'journal-entry done' : 'journal-entry'} key={entry.id}>
              <button className="check-button" title={entry.done ? 'Mark not done' : 'Mark done'} onClick={() => updateEntry(entry.id, { done: !entry.done })}>{entry.done && <Check size={15} />}</button>
              <time>{entry.time || 'Anytime'}</time>
              <div><strong>{entry.title || 'Untitled moment'}</strong>{entry.location && <span><MapPin size={12} />{entry.location}</span>}{entry.notes && <p>{entry.notes}</p>}</div>
              <button className="icon-button danger" title="Delete activity" onClick={() => onUpdateDay(selectedDay.id, { entries: entries.filter((item) => item.id !== entry.id) })}><Trash2 size={15} /></button>
            </div>)}
          </div>
        </section>

        <section className="journal-notes">
          <label><span>Today's story</span><textarea rows="6" value={selectedDay.diary || ''} placeholder="What happened today? Write down the details you want to remember..." onChange={(event) => onUpdateDay(selectedDay.id, { diary: event.target.value })} /></label>
        </section>

        {(photos.length > 0 || photoError) && <section className="journal-photos"><div className="journal-section-title"><div><p className="eyebrow">Camera roll</p><h3>Photos</h3></div><span>{photos.length}/8</span></div>{photoError && <p className="form-error">{photoError}</p>}<div className="photo-grid">
          {photos.map((photo) => <figure key={photo.id}><img src={photo.dataUrl} alt={photo.caption || photo.name || 'Journal memory'} /><button className="photo-delete" title="Delete photo" onClick={() => onUpdateDay(selectedDay.id, { photos: photos.filter((item) => item.id !== photo.id) })}><Trash2 size={14} /></button><input value={photo.caption} placeholder="Add a caption" aria-label="Photo caption" onChange={(event) => onUpdateDay(selectedDay.id, { photos: photos.map((item) => item.id === photo.id ? { ...item, caption: event.target.value } : item) })} /></figure>)}
        </div></section>}

        <section className="region-suggestions">
          <div className="journal-section-title"><div><p className="eyebrow">Around {selectedDay.region || 'this region'}{selectedNeighborhoods.length ? ` · ${selectedNeighborhoods.join(', ')}` : ''}</p><h3>What could we do?</h3></div><Lightbulb size={19} /></div>
          {!matchingIdeas.length && <p className="journal-empty">No regional ideas yet. Add some in the Ideas view before or during your trip.</p>}
          <div className="suggestion-grid">{suggestedIdeas.map((idea) => {
            const commonsPhoto = commonsPhotos[idea.id]
            const image = commonsPhoto?.thumbnail || suggestionImages[idea.type.trim().toLowerCase()] || defaultSuggestionImage
            return <article className={usedIdeaIds.has(idea.id) ? 'suggestion-card added' : 'suggestion-card'} key={idea.id}>
              <img className="suggestion-image" src={image} alt={`${idea.title} in Japan`} loading="lazy" onError={(event) => { event.currentTarget.src = defaultSuggestionImage }} />
              <div className="suggestion-card-content"><div className="suggestion-card-details"><span>{idea.type}</span><h4>{idea.title}</h4>{idea.location && <p><MapPin size={12} />{idea.location}</p>}</div>{usedIdeaIds.has(idea.id) ? <b><Check size={14} /> Added</b> : <div><button className="icon-button" title="Add to today" onClick={() => addIdea(idea)}><Plus size={16} /></button><button className="icon-button" title="Mark as done today" onClick={() => addIdea(idea, true)}><Check size={16} /></button></div>}</div>
            </article>
          })}</div>
        </section>
      </article>
    </div>
  )
}