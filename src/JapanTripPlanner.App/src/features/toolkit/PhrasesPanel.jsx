import { useState } from 'react'
import { Languages, Plus, Trash2 } from 'lucide-react'
import { STORAGE_KEYS, useLocalStorage } from '../../hooks/useLocalStorage.js'

const starterPhrases = [
  { id: crypto.randomUUID(), japanese: 'すみません', pronunciation: 'Sumimasen', meaning: 'Excuse me / sorry' },
  { id: crypto.randomUUID(), japanese: 'ありがとうございます', pronunciation: 'Arigatou gozaimasu', meaning: 'Thank you very much' },
  { id: crypto.randomUUID(), japanese: 'これをください', pronunciation: 'Kore o kudasai', meaning: 'This one, please' },
  { id: crypto.randomUUID(), japanese: '英語を話せますか？', pronunciation: 'Eigo o hanasemasu ka?', meaning: 'Do you speak English?' },
]

export default function PhrasesPanel() {
  const [phrases, setPhrases] = useLocalStorage(STORAGE_KEYS.phrases, starterPhrases)
  const [form, setForm] = useState({ japanese: '', pronunciation: '', meaning: '' })
  function addPhrase(event) { event.preventDefault(); if (!form.japanese.trim() || !form.meaning.trim()) return; setPhrases((current) => [...current, { ...form, id: crypto.randomUUID() }]); setForm({ japanese: '', pronunciation: '', meaning: '' }) }
  return <div className="tool-layout"><section className="tool-content"><div className="section-heading"><div><p className="eyebrow">A few useful words</p><h2>Japanese phrasebook</h2></div><span>{phrases.length} phrases</span></div><div className="phrase-list">
    {!phrases.length && <div className="tool-empty"><Languages size={25} /><p>Add words and phrases you want within quick reach.</p></div>}
    {phrases.map((phrase) => <article className="phrase-record" key={phrase.id}><strong lang="ja">{phrase.japanese}</strong><div><b>{phrase.meaning}</b><span>{phrase.pronunciation}</span></div><button className="icon-button danger" title="Delete phrase" onClick={() => setPhrases((current) => current.filter((item) => item.id !== phrase.id))}><Trash2 size={16} /></button></article>)}
  </div></section><aside className="tool-form-panel"><p className="eyebrow">New vocabulary</p><h2>Add a phrase</h2><form onSubmit={addPhrase}><label><span>Japanese</span><input required value={form.japanese} onChange={(event) => setForm({ ...form, japanese: event.target.value })} /></label><label><span>Pronunciation</span><input value={form.pronunciation} placeholder="Romaji" onChange={(event) => setForm({ ...form, pronunciation: event.target.value })} /></label><label><span>Meaning</span><input required value={form.meaning} onChange={(event) => setForm({ ...form, meaning: event.target.value })} /></label><button className="primary-button" type="submit"><Plus size={17} /> Add phrase</button></form></aside></div>
}