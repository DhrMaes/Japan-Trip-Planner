import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { CalendarDays, CircleDollarSign, CloudSun, Map, Plane, RotateCcw, Utensils } from 'lucide-react'
import BudgetView from './features/budget/BudgetView.jsx'
import ItineraryView from './features/itinerary/ItineraryView.jsx'
import ToolkitView from './features/toolkit/ToolkitView.jsx'
import { auth, googleProvider } from './firebase.js'
import { clearPlannerData } from './hooks/useLocalStorage.js'

const tabs = [
  { id: 'itinerary', label: 'Itinerary', icon: CalendarDays },
  { id: 'budget', label: 'Budget', icon: CircleDollarSign },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'weather', label: 'Weather', icon: CloudSun },
]

function App() {
  const [activeTab, setActiveTab] = useState('itinerary')
  const [user, setUser] = useState(null)

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  async function toggleAccount() {
    if (user) {
      await signOut(auth)
      return
    }
    await signInWithPopup(auth, googleProvider)
  }

  function resetData() {
    if (window.confirm('Clear your itinerary, budget, and packing data? This cannot be undone.')) {
      clearPlannerData()
      window.location.reload()
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Map size={22} /></span>
          <div><strong>Japan</strong><span>Trip planner</span></div>
        </div>
        <nav aria-label="Main navigation">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button className={activeTab === id ? 'nav-item active' : 'nav-item'} key={id} onClick={() => setActiveTab(id)}>
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="account-button" onClick={toggleAccount}>
          {user ? <><span className="account-avatar">{user.displayName?.charAt(0) || 'J'}</span><span><strong>{user.displayName || 'Signed in'}</strong><small>Sign out</small></span></> : <><span className="account-avatar">+</span><span><strong>Cloud sync</strong><small>Sign in with Google</small></span></>}
        </button>
        <button className="reset-button" onClick={resetData}><RotateCcw size={17} /> Reset data</button>
      </aside>
      <main className="main-content">
        <header className="mobile-header"><Map size={20} /><strong>Japan Trip</strong></header>
        {activeTab === 'itinerary' ? <ItineraryView /> : activeTab === 'budget' ? <BudgetView /> : <ToolkitView activeTool={activeTab} />}
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button className={activeTab === id ? 'active' : ''} key={id} onClick={() => setActiveTab(id)}>
            <Icon size={20} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App