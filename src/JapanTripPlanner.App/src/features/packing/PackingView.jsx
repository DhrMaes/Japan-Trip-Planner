import { useEffect, useState } from 'react'
import { Check, PackageCheck, Plus, Trash2 } from 'lucide-react'
import { STORAGE_KEYS, useLocalStorage } from '../../hooks/useLocalStorage.js'

const starterCategories = [
  { id: 'clothing', name: 'Clothing' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'documents', name: 'Documents' },
  { id: 'toiletries', name: 'Toiletries' },
  { id: 'misc', name: 'Misc' },
]

const starterItems = [
  { id: 'clothing-t-shirts', categoryId: 'clothing', name: 'T-shirts', packed: false },
  { id: 'clothing-long-sleeve-t-shirts', categoryId: 'clothing', name: 'Long-sleeve T-shirts', packed: false },
  { id: 'clothing-sweater', categoryId: 'clothing', name: 'Sweater', packed: false },
  { id: 'clothing-fleece', categoryId: 'clothing', name: 'Fleece', packed: false },
  { id: 'clothing-rain-jacket', categoryId: 'clothing', name: 'Rain jacket', packed: false },
  { id: 'clothing-trousers', categoryId: 'clothing', name: 'Trousers', packed: false },
  { id: 'clothing-shorts', categoryId: 'clothing', name: 'Shorts', packed: false },
  { id: 'clothing-dresses', categoryId: 'clothing', name: 'Dresses', packed: false },
  { id: 'clothing-leggings', categoryId: 'clothing', name: 'Leggings', packed: false },
  { id: 'clothing-underwear', categoryId: 'clothing', name: 'Underwear', packed: false },
  { id: 'clothing-socks', categoryId: 'clothing', name: 'Socks', packed: false },
  { id: 'clothing-hiking-socks', categoryId: 'clothing', name: 'Hiking socks', packed: false },
  { id: 'clothing-pyjamas', categoryId: 'clothing', name: 'Pyjamas', packed: false },
  { id: 'clothing-swimwear', categoryId: 'clothing', name: 'Swimwear', packed: false },
  { id: 'clothing-scarf', categoryId: 'clothing', name: 'Scarf', packed: false },
  { id: 'clothing-beanie', categoryId: 'clothing', name: 'Beanie', packed: false },
  { id: 'clothing-gloves', categoryId: 'clothing', name: 'Gloves', packed: false },
  { id: 'clothing-walking-shoes', categoryId: 'clothing', name: 'Comfortable walking shoes', packed: false },
  { id: 'clothing-regular-shoes', categoryId: 'clothing', name: 'Regular shoes', packed: false },
  { id: 'clothing-sandals', categoryId: 'clothing', name: 'Sandals', packed: false },
  { id: 'clothing-extra-park-socks', categoryId: 'clothing', name: 'Extra pair of socks (theme park)', packed: false },
  { id: 'clothing-extra-park-t-shirt', categoryId: 'clothing', name: 'Extra T-shirt (theme park)', packed: false },
  { id: 'electronics-powerbank', categoryId: 'electronics', name: 'Power bank', packed: false },
  { id: 'electronics-travel-adapter', categoryId: 'electronics', name: 'Universal travel adapter', packed: false },
  { id: 'electronics-chargers', categoryId: 'electronics', name: 'Chargers and cables', packed: false },
  { id: 'electronics-esim', categoryId: 'electronics', name: 'E-sim arranged in advance', packed: false },
  { id: 'documents-passport', categoryId: 'documents', name: 'Passport', packed: false },
  { id: 'documents-tickets', categoryId: 'documents', name: 'Flight tickets / bookings', packed: false },
  { id: 'documents-insurance', categoryId: 'documents', name: 'Travel insurance documents', packed: false },
  { id: 'documents-cash', categoryId: 'documents', name: 'Cash', packed: false },
  { id: 'documents-credit-card', categoryId: 'documents', name: 'Credit card', packed: false },
  { id: 'documents-ic-card', categoryId: 'documents', name: 'IC card (Suica / Pasmo)', packed: false },
  { id: 'toiletries-medicine', categoryId: 'toiletries', name: 'Travel medicine kit', packed: false },
  { id: 'toiletries-sunscreen', categoryId: 'toiletries', name: 'Sunscreen', packed: false },
  { id: 'toiletries-lip-balm', categoryId: 'toiletries', name: 'Lip balm', packed: false },
  { id: 'toiletries-hand-cream', categoryId: 'toiletries', name: 'Hand cream', packed: false },
  { id: 'toiletries-masks', categoryId: 'toiletries', name: 'Face masks', packed: false },
  { id: 'toiletries-sanitizer', categoryId: 'toiletries', name: 'Hand sanitizer', packed: false },
  { id: 'toiletries-wipes', categoryId: 'toiletries', name: 'Wet wipes (small pack)', packed: false },
  { id: 'misc-laundry-bag', categoryId: 'misc', name: 'Laundry bag for dirty clothes', packed: false },
  { id: 'misc-water-bottle', categoryId: 'misc', name: 'Reusable water bottle', packed: false },
  { id: 'misc-earbuds', categoryId: 'misc', name: 'Earbuds', packed: false },
  { id: 'misc-sleep-mask', categoryId: 'misc', name: 'Sleep mask', packed: false },
  { id: 'misc-snacks', categoryId: 'misc', name: 'Snacks', packed: false },
  { id: 'misc-tote-bags', categoryId: 'misc', name: 'Tote bags', packed: false },
]

const initialPacking = { categories: starterCategories, items: starterItems }

export default function PackingView() {
  const [packing, setPacking] = useLocalStorage(STORAGE_KEYS.packing, initialPacking)
  const [newItem, setNewItem] = useState({ name: '', categoryId: 'clothing' })
  const [newCategory, setNewCategory] = useState('')
  const [filter, setFilter] = useState('all')
  useEffect(() => {
    setPacking((current) => {
      const existingNames = new Set(current.items.map((item) => `${item.categoryId}:${item.name.toLowerCase()}`))
      const missingItems = starterItems.filter((item) => !existingNames.has(`${item.categoryId}:${item.name.toLowerCase()}`))
      return missingItems.length ? { ...current, items: [...current.items, ...missingItems] } : current
    })
  }, [packing.items, setPacking])
  const packedCount = packing.items.filter((item) => item.packed).length
  const progress = packing.items.length ? Math.round((packedCount / packing.items.length) * 100) : 0

  function addItem(event) {
    event.preventDefault()
    if (!newItem.name.trim()) return
    setPacking((current) => ({ ...current, items: [...current.items, { id: crypto.randomUUID(), categoryId: newItem.categoryId, name: newItem.name.trim(), packed: false }] }))
    setNewItem((current) => ({ ...current, name: '' }))
  }

  function addCategory(event) {
    event.preventDefault()
    const name = newCategory.trim()
    if (!name) return
    const id = crypto.randomUUID()
    setPacking((current) => ({ ...current, categories: [...current.categories, { id, name }] }))
    setNewItem((current) => ({ ...current, categoryId: id }))
    setNewCategory('')
  }

  function updateItem(itemId, patch) {
    setPacking((current) => ({ ...current, items: current.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) }))
  }

  function deleteCategory(categoryId) {
    const itemCount = packing.items.filter((item) => item.categoryId === categoryId).length
    if (window.confirm(`Delete this category${itemCount ? ` and its ${itemCount} items` : ''}?`)) {
      setPacking((current) => ({ categories: current.categories.filter((category) => category.id !== categoryId), items: current.items.filter((item) => item.categoryId !== categoryId) }))
      setNewItem((current) => ({ ...current, categoryId: packing.categories.find((category) => category.id !== categoryId)?.id || '' }))
    }
  }

  const matchesFilter = (item) => filter === 'all' || (filter === 'packed' ? item.packed : !item.packed)

  return (
    <div className="feature-view">
      <div className="view-heading">
        <div><p className="eyebrow">Ready to go</p><h1>Packing list</h1><p>{packedCount}/{packing.items.length} packed</p></div>
        <div className="packing-score"><strong>{progress}%</strong><span>complete</span></div>
      </div>

      <div className="packing-progress" aria-label={`${progress}% packed`}><span style={{ width: `${progress}%` }} /></div>

      <div className="packing-layout">
        <div className="packing-main">
          <div className="packing-toolbar">
            <div className="segmented-control" aria-label="Filter packing list">
              {['all', 'unpacked', 'packed'].map((option) => <button className={filter === option ? 'active' : ''} key={option} onClick={() => setFilter(option)}>{option[0].toUpperCase() + option.slice(1)}</button>)}
            </div>
            {packing.items.length > 0 && <button className="text-button" onClick={() => setPacking((current) => ({ ...current, items: current.items.map((item) => ({ ...item, packed: true })) }))}><Check size={16} /> Mark all packed</button>}
          </div>

          <div className="packing-categories">
            {packing.categories.map((category) => {
              const categoryItems = packing.items.filter((item) => item.categoryId === category.id)
              const visibleItems = categoryItems.filter(matchesFilter)
              if (!visibleItems.length && filter !== 'all') return null
              return (
                <section className="packing-category" key={category.id}>
                  <header>
                    <div><input value={category.name} aria-label="Category name" onChange={(event) => setPacking((current) => ({ ...current, categories: current.categories.map((item) => item.id === category.id ? { ...item, name: event.target.value } : item) }))} /><span>{categoryItems.filter((item) => item.packed).length}/{categoryItems.length}</span></div>
                    <button className="icon-button danger" title="Delete category" onClick={() => deleteCategory(category.id)}><Trash2 size={15} /></button>
                  </header>
                  <div className="checklist">
                    {!visibleItems.length && <p className="empty-category">Nothing here yet.</p>}
                    {visibleItems.map((item) => (
                      <div className={item.packed ? 'checklist-item packed' : 'checklist-item'} key={item.id}>
                        <button className="check-button" aria-label={item.packed ? `Mark ${item.name} unpacked` : `Mark ${item.name} packed`} onClick={() => updateItem(item.id, { packed: !item.packed })}>{item.packed && <Check size={15} />}</button>
                        <input value={item.name} aria-label="Packing item" onChange={(event) => updateItem(item.id, { name: event.target.value })} />
                        <button className="icon-button danger" title="Delete item" onClick={() => setPacking((current) => ({ ...current, items: current.items.filter((entry) => entry.id !== item.id) }))}><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
            {!packing.categories.length && <div className="empty-state"><PackageCheck size={28} /><h2>No categories yet</h2><p>Add one to start your packing list.</p></div>}
          </div>
        </div>

        <aside className="packing-form-panel">
          <p className="eyebrow">Checklist</p><h2>Add an item</h2>
          <form onSubmit={addItem}>
            <label><span>Item</span><input required value={newItem.name} placeholder="Pocket Wi-Fi" onChange={(event) => setNewItem({ ...newItem, name: event.target.value })} /></label>
            <label><span>Category</span><select required value={newItem.categoryId} onChange={(event) => setNewItem({ ...newItem, categoryId: event.target.value })}>{packing.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
            <button className="primary-button" type="submit" disabled={!packing.categories.length}><Plus size={17} /> Add item</button>
          </form>
          <div className="category-form-divider"><span>or add a category</span></div>
          <form className="new-category-form" onSubmit={addCategory}>
            <input value={newCategory} placeholder="Medication" aria-label="New category name" onChange={(event) => setNewCategory(event.target.value)} />
            <button className="icon-primary-button" title="Add category" type="submit"><Plus size={18} /></button>
          </form>
        </aside>
      </div>
    </div>
  )
}