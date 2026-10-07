import { useState } from 'react'
import { Check, MapPin, Plus, Store, Trash2, Utensils } from 'lucide-react'
import { STORAGE_KEYS, useLocalStorage } from '../../hooks/useLocalStorage.js'

export default function FoodPanel() {
  const [places, setPlaces] = useLocalStorage(STORAGE_KEYS.food, [])
  const [mode, setMode] = useState('food')
  const [form, setForm] = useState({ name: '', city: '', address: '', note: '' })
  const foodItems = places.filter((place) => place.kind === 'food')
  const restaurants = places.filter((place) => place.kind !== 'food')
  const completedCount = foodItems.filter((item) => item.done).length

  function addPlace(event) {
    event.preventDefault()
    if (!form.name.trim()) return
    setPlaces((current) => [...current, { ...form, id: crypto.randomUUID(), kind: mode, done: false }])
    setForm({ name: '', city: '', address: '', note: '' })
  }

  function toggleTried(id) {
    setPlaces((current) => current.map((item) => item.id === id ? { ...item, done: !item.done } : item))
  }

  function deleteItem(id) {
    setPlaces((current) => current.filter((item) => item.id !== id))
  }

  return <div className="tool-layout"><section className="tool-content">
    <div className="section-heading"><div><p className="eyebrow">Taste of Japan</p><h2>{mode === 'food' ? 'Food to try' : 'Restaurants'}</h2></div><span>{mode === 'food' ? `${completedCount}/${foodItems.length} tried` : `${restaurants.length} saved`}</span></div>
    <div className="segmented-control food-mode-control" aria-label="Food and restaurants">
      <button className={mode === 'food' ? 'active' : ''} onClick={() => setMode('food')}><Utensils size={15} /> Food</button>
      <button className={mode === 'restaurants' ? 'active' : ''} onClick={() => setMode('restaurants')}><Store size={15} /> Restaurants</button>
    </div>
    {mode === 'food' ? <div className="food-list">
      {!foodItems.length && <div className="tool-empty"><Utensils size={25} /><p>Add dishes, snacks, and local specialties you want to try.</p></div>}
      {foodItems.map((item) => <article className={item.done ? 'food-record done' : 'food-record'} key={item.id}><button className="check-button" title={item.done ? 'Mark not tried' : 'Mark tried'} aria-label={item.done ? `Mark ${item.name} not tried` : `Mark ${item.name} tried`} onClick={() => toggleTried(item.id)}>{item.done && <Check size={15} />}</button><div><h3>{item.name}</h3>{item.city && <span><MapPin size={13} />{item.city}</span>}</div><button className="icon-button danger" title={`Delete ${item.name}`} onClick={() => deleteItem(item.id)}><Trash2 size={16} /></button></article>)}
    </div> : <div className="record-grid food-restaurant-grid">
      {!restaurants.length && <div className="tool-empty"><Store size={25} /><p>Save restaurant details, locations, and what you want to order.</p></div>}
      {restaurants.map((place) => <article className="food-restaurant-card" key={place.id}><div className="food-restaurant-city">{place.city || 'City not set'}</div><h3>{place.name}</h3>{place.address && <p><MapPin size={13} />{place.address}</p>}{place.note && <div className="food-restaurant-note"><span>To order / notes</span><p>{place.note}</p></div>}<button className="icon-button danger" title={`Delete ${place.name}`} onClick={() => deleteItem(place.id)}><Trash2 size={16} /></button></article>)}
    </div>}
  </section><aside className="tool-form-panel"><p className="eyebrow">{mode === 'food' ? 'Something delicious' : 'A place to eat'}</p><h2>{mode === 'food' ? 'Add food to try' : 'Add a restaurant'}</h2><form onSubmit={addPlace}>
    <label><span>{mode === 'food' ? 'Food or dish' : 'Restaurant name'}</span><input required value={form.name} placeholder={mode === 'food' ? 'Okonomiyaki' : 'Katsukura'} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
    {mode === 'food' ? <label><span>City (optional)</span><input value={form.city} placeholder="Osaka" onChange={(event) => setForm({ ...form, city: event.target.value })} /></label> : <>
      <label><span>City</span><input value={form.city} placeholder="Kyoto" onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
      <label><span>Address / neighborhood</span><input value={form.address} placeholder="Nishiki Market" onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
      <label><span>What to order / notes</span><textarea rows="3" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
    </>}
    <button className="primary-button" type="submit"><Plus size={17} />{mode === 'food' ? 'Add to checklist' : 'Save restaurant'}</button>
  </form></aside></div>
}