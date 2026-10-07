import { useState } from 'react'
import { Backpack, BedDouble, Plane } from 'lucide-react'
import TransportPanel from './TransportPanel.jsx'
import StaysPanel from './StaysPanel.jsx'
import PackingView from '../packing/PackingView.jsx'
import FoodPanel from './FoodPanel.jsx'
import WeatherPanel from './WeatherPanel.jsx'

const tools = [
  { id: 'transport', label: 'Transport', description: 'Flights, trains, Shinkansen, and JR Pass details', component: TransportPanel },
  { id: 'stays', label: 'Stays', description: 'Hotels and booking details by city', component: StaysPanel },
  { id: 'food', label: 'Food', description: 'Restaurants, markets, and dishes to try', component: FoodPanel },
  { id: 'weather', label: 'Weather', description: 'Seven-day forecasts for your destinations', component: WeatherPanel },
]

export default function ToolkitView({ activeTool }) {
  const [activeTravelTab, setActiveTravelTab] = useState('transport')
  if (activeTool === 'travel') {
    const TravelPanel = activeTravelTab === 'transport' ? TransportPanel : activeTravelTab === 'stays' ? StaysPanel : PackingView
    return (
      <div className="feature-view toolkit-view">
        <div className="view-heading"><div><p className="eyebrow">Travel essentials</p><h1>Travel</h1><p>Getting around, places to stay, and what to pack</p></div></div>
        <div className="segmented-control travel-tabs" aria-label="Travel sections">
          <button className={activeTravelTab === 'transport' ? 'active' : ''} onClick={() => setActiveTravelTab('transport')}><Plane size={15} /><span>Transport</span></button>
          <button className={activeTravelTab === 'stays' ? 'active' : ''} onClick={() => setActiveTravelTab('stays')}><BedDouble size={15} /><span>Stays</span></button>
          <button className={activeTravelTab === 'packing' ? 'active' : ''} onClick={() => setActiveTravelTab('packing')}><Backpack size={15} /><span>Packing</span></button>
        </div>
        <TravelPanel />
      </div>
    )
  }

  const tool = tools.find((item) => item.id === activeTool) || tools[0]
  const ActivePanel = tool.component

  return (
    <div className="feature-view toolkit-view">
      <div className="view-heading"><div><p className="eyebrow">Travel essentials</p><h1>{tool.label}</h1><p>{tool.description}</p></div></div>
      <ActivePanel />
    </div>
  )
}