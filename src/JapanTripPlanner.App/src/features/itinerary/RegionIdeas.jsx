import { useState } from 'react'
import { Check, Lightbulb, MapPin, Pencil, Plus, Sparkles, Star, Trash2, X } from 'lucide-react'
const ideaTypes = ['temples & shrines', 'streetfood', 'restaurants', 'bakery', 'shopping', 'activiteiten', 'nature', 'wijken', 'nightlife']
const legacyTypeMap = { Shop: 'shopping', Restaurant: 'restaurants', Cafe: 'streetfood', Sight: 'temples & shrines', Activity: 'activiteiten', Other: 'nature' }

function suggestNotes(idea) {
  const type = idea.type.toLowerCase()
  const title = idea.title.trim()
  const region = idea.region.trim()
  const suggestions = {
    'temples & shrines': `A memorable place to explore in ${region}. Check the best time to visit and allow extra time for photos.`,
    streetfood: `A great way to taste something local in ${region}. Note what you want to try and check the best time to visit.`,
    restaurants: `Try ${title} in ${region} for a memorable local meal. Check opening hours and whether reservations are needed.`,
    bakery: `A good place to find fresh pastries and local treats in ${region}. Check opening hours and note what you want to try.`,
    shopping: `Worth browsing for something distinctive from ${region}. Check opening hours and leave room in your luggage.`,
    activiteiten: `A fun way to experience ${region}. Check availability in advance and note the meeting point.`,
    nature: `A refreshing place to experience nature around ${region}. Check the route, weather, and time needed to get there.`,
    wijken: `A neighborhood worth wandering through in ${region}. Leave room for unplanned discoveries and local spots.`,
    nightlife: `A promising evening in ${region}. Check opening hours, reservations, and the best way to get back.`,
  }
  return suggestions[type] || suggestions.other
}

function getNeighborhood(location) {
  return location?.trim().split(/\s*[·,|]\s*/)[0] || 'Neighborhood not set'
}

function RatingStars({ rating = 0, onChange, label = 'Idea rating' }) {
  return <div className="rating-stars" role="group" aria-label={label}>
    {[1, 2, 3, 4, 5].map((value) => <button className={value <= rating ? 'active' : ''} type="button" title={`${value} out of 5 stars`} aria-label={`${value} out of 5 stars`} key={value} onClick={() => onChange(value === rating ? 0 : value)}><Star size={17} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}
  </div>
}

export default function RegionIdeas({ ideas, regions, onChange }) {
  const [form, setForm] = useState({ region: regions[0] || '', type: 'restaurants', title: '', location: '', notes: '', rating: 0 })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const groupedIdeas = ideas.reduce((groups, idea) => {
    const region = idea.region.trim() || 'Region not set'
    return { ...groups, [region]: [...(groups[region] || []), idea] }
  }, {})

  function addIdea(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.region.trim()) return
    const nextIdea = { ...form, id: crypto.randomUUID(), title: form.title.trim(), region: form.region.trim() }
    onChange([...ideas, { ...nextIdea, notes: nextIdea.notes.trim() || suggestNotes(nextIdea) }])
    setForm((current) => ({ ...current, title: '', location: '', notes: '' }))
  }

  function startEditing(idea) {
    setEditingId(idea.id)
    setEditForm({ ...idea, type: legacyTypeMap[idea.type] || idea.type })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditForm(null)
  }

  function saveEdit(event) {
    event.preventDefault()
    if (!editForm?.title.trim() || !editForm.region.trim()) return
    const updatedIdea = { ...editForm, title: editForm.title.trim(), region: editForm.region.trim(), notes: editForm.notes.trim() || suggestNotes(editForm) }
    onChange(ideas.map((idea) => idea.id === updatedIdea.id ? updatedIdea : idea))
    cancelEditing()
  }

  return (
    <div className="ideas-layout">
      <div className="ideas-main">
        {!ideas.length && <div className="empty-state"><Lightbulb size={28} /><h2>Build your regional shortlist</h2><p>Save shops, restaurants, sights, and anything else worth remembering.</p></div>}
        {Object.entries(groupedIdeas).map(([region, regionIdeas]) => (
          <section className="idea-region" key={region}>
            <header><div><p className="eyebrow">Region</p><h2>{region}</h2></div><span>{regionIdeas.length} {regionIdeas.length === 1 ? 'idea' : 'ideas'}</span></header>
            {Object.entries(regionIdeas.reduce((groups, idea) => {
              const neighborhood = getNeighborhood(idea.location)
              return { ...groups, [neighborhood]: [...(groups[neighborhood] || []), idea] }
            }, {})).map(([neighborhood, neighborhoodIdeas]) => <div className="idea-neighborhood" key={neighborhood}>
              <div className="idea-neighborhood-heading"><h3>{neighborhood}</h3><span>{neighborhoodIdeas.length}</span></div>
              <div className="idea-grid">
              {neighborhoodIdeas.map((idea) => (
                <article className="idea-card" key={idea.id}>
                  {editingId === idea.id ? <form className="idea-edit-form" onSubmit={saveEdit}>
                    <label><span>Region</span><input required value={editForm.region} onChange={(event) => setEditForm({ ...editForm, region: event.target.value })} /></label>
                    <label><span>Type</span><select value={editForm.type} onChange={(event) => setEditForm({ ...editForm, type: event.target.value })}>{ideaTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
                    <label><span>Name</span><input required value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} /></label>
                    <label><span>Location</span><input value={editForm.location} onChange={(event) => setEditForm({ ...editForm, location: event.target.value })} /></label>
                    <label><span>Notes</span><textarea rows="3" value={editForm.notes} placeholder="Leave empty for an auto note" onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} /></label>
                    <label><span>Rating</span><RatingStars rating={editForm.rating} onChange={(rating) => setEditForm({ ...editForm, rating })} label={`Rating for ${editForm.title || 'idea'}`} /></label>
                    <div className="idea-edit-actions"><button className="primary-button" type="submit"><Check size={15} /> Save</button><button className="icon-button" type="button" title="Cancel editing" onClick={cancelEditing}><X size={16} /></button></div>
                  </form> : <>
                    <div className="idea-type">{idea.type}</div>
                    <h3>{idea.title}</h3>
                    {idea.location && <span><MapPin size={13} />{idea.location}</span>}
                    {idea.notes && <p>{idea.notes}</p>}
                    <RatingStars rating={idea.rating} onChange={(rating) => onChange(ideas.map((item) => item.id === idea.id ? { ...item, rating } : item))} label={`Rating for ${idea.title}`} />
                    <div className="idea-card-actions"><button className="icon-button" title="Edit idea" onClick={() => startEditing(idea)}><Pencil size={15} /></button><button className="icon-button danger" title="Delete idea" onClick={() => onChange(ideas.filter((item) => item.id !== idea.id))}><Trash2 size={15} /></button></div>
                  </>}
                </article>
              ))}
              </div>
            </div>)}
          </section>
        ))}
      </div>

      <aside className="idea-form-panel">
        <p className="eyebrow">Save for later</p><h2>Add an idea</h2>
        <form onSubmit={addIdea}>
          <label><span>Region</span><input list="trip-regions" required value={form.region} placeholder="Tokyo" onChange={(event) => setForm({ ...form, region: event.target.value })} /></label>
          <datalist id="trip-regions">{regions.map((region) => <option value={region} key={region} />)}</datalist>
          <label><span>Type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{ideaTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
          <label><span>Name</span><input required value={form.title} placeholder="Kappabashi Street" onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label><span>Location</span><input value={form.location} placeholder="Address or neighborhood" onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
          <label><span>Notes</span><textarea rows="3" value={form.notes} placeholder="Leave empty for an auto note" onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          <label><span>Rating</span><RatingStars rating={form.rating} onChange={(rating) => setForm({ ...form, rating })} label="New idea rating" /></label>
          <p className="form-hint"><Sparkles size={13} /> Empty notes get a smart suggestion when saved.</p>
          <button className="primary-button" type="submit"><Plus size={17} /> Save idea</button>
        </form>
      </aside>
    </div>
  )
}