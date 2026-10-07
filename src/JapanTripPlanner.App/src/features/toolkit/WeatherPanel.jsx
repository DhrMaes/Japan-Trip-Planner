import { useEffect, useState } from 'react'
import { CloudRain, CloudSun, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { STORAGE_KEYS, useLocalStorage } from '../../hooks/useLocalStorage.js'

const weatherLabels = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle', 61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Snow', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm' }
const fujiCoordinates = { latitude: 35.3606, longitude: 138.7274 }

function getFujiVisibility(cloudCover, rainChance) {
  if (rainChance >= 60 || cloudCover >= 75) return { label: 'Unlikely', tone: 'low' }
  if (rainChance >= 35 || cloudCover >= 50) return { label: 'Limited', tone: 'limited' }
  if (rainChance >= 20 || cloudCover >= 30) return { label: 'Possible', tone: 'possible' }
  return { label: 'Good chance', tone: 'good' }
}

async function fetchFujiDays(signal) {
  const params = new URLSearchParams({ ...fujiCoordinates, daily: 'cloud_cover_mean,precipitation_probability_max', timezone: 'Asia/Tokyo', forecast_days: '7' })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal })
  if (!response.ok) throw new Error('Fuji forecast unavailable.')
  const forecast = await response.json()
  return forecast.daily.time.map((date, index) => ({
    date,
    cloudCover: forecast.daily.cloud_cover_mean[index],
    rain: forecast.daily.precipitation_probability_max[index],
  }))
}

export default function WeatherPanel() {
  const [locations, setLocations] = useLocalStorage(STORAGE_KEYS.weather, [])
  const [city, setCity] = useState('')
  const [status, setStatus] = useState({ loading: false, error: '' })
  const hakoneIdsKey = JSON.stringify(locations.filter((location) => location.city.toLowerCase().includes('hakone') && !location.fujiDays).map((location) => location.id))

  useEffect(() => {
    const hakoneIds = JSON.parse(hakoneIdsKey)
    if (!hakoneIds.length) return undefined
    const controller = new AbortController()
    fetchFujiDays(controller.signal)
      .then((fujiDays) => {
        if (!controller.signal.aborted) {
          setLocations((current) => current.map((location) => hakoneIds.includes(location.id) && !location.fujiDays ? { ...location, fujiDays } : location))
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') console.error('Could not load Mount Fuji visibility forecast.', error)
      })
    return () => controller.abort()
  }, [hakoneIdsKey, setLocations])

  async function fetchWeather(cityName, existingId) {
    setStatus({ loading: true, error: '' })
    try {
      const geocode = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`)
      if (!geocode.ok) throw new Error('Could not look up that city.')
      const place = (await geocode.json()).results?.[0]
      if (!place) throw new Error('City not found. Try a more specific name.')
      const forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`)
      if (!forecastResponse.ok) throw new Error('Weather service is unavailable.')
      const forecast = await forecastResponse.json()
      const days = forecast.daily.time.map((date, index) => ({ date, code: forecast.daily.weather_code[index], max: forecast.daily.temperature_2m_max[index], min: forecast.daily.temperature_2m_min[index], rain: forecast.daily.precipitation_probability_max[index] }))
      let fujiDays
      if (place.name.toLowerCase().includes('hakone')) {
        try { fujiDays = await fetchFujiDays() } catch { fujiDays = undefined }
      }
      const record = { id: existingId || crypto.randomUUID(), city: place.name, country: place.country, updatedAt: new Date().toISOString(), days, ...(fujiDays ? { fujiDays } : {}) }
      setLocations((current) => existingId ? current.map((item) => item.id === existingId ? record : item) : [...current.filter((item) => item.city !== record.city), record])
      setCity('')
      setStatus({ loading: false, error: '' })
    } catch (error) {
      setStatus({ loading: false, error: error.message })
    }
  }

  function submit(event) { event.preventDefault(); if (city.trim()) fetchWeather(city.trim()) }

  return <div className="weather-panel"><div className="weather-search"><div><p className="eyebrow">Live 7-day outlook</p><h2>Weather by city</h2><span>Powered by Open-Meteo · Last forecasts remain available offline</span></div><form onSubmit={submit}><input value={city} placeholder="Search a Japanese city" aria-label="Weather city" onChange={(event) => setCity(event.target.value)} /><button className="primary-button" disabled={status.loading} type="submit"><Plus size={17} />{status.loading ? 'Loading…' : 'Add city'}</button></form>{status.error && <p className="form-error">{status.error}</p>}</div>
    <div className="weather-locations">{!locations.length && <div className="tool-empty"><CloudSun size={27} /><p>Add cities to see temperatures and rain chances for each day.</p></div>}{locations.map((location) => {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
      const fujiToday = location.fujiDays?.find((day) => day.date === today)
      const fujiVisibility = fujiToday ? getFujiVisibility(fujiToday.cloudCover, fujiToday.rain) : null
      return <section className="weather-location" key={location.id}><header><div><h3>{location.city}</h3><span>{location.country} · Updated {new Date(location.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><button className="icon-button" title="Refresh weather" onClick={() => fetchWeather(location.city, location.id)}><RefreshCw size={16} /></button><button className="icon-button danger" title="Delete city weather" onClick={() => setLocations((current) => current.filter((item) => item.id !== location.id))}><Trash2 size={16} /></button></header>{location.city.toLowerCase().includes('hakone') && <div className="fuji-visibility"><div><p className="eyebrow">Mount Fuji · today</p><strong className={fujiVisibility ? `fuji-visibility-${fujiVisibility.tone}` : ''}>{fujiVisibility?.label || 'Forecast unavailable'}</strong></div>{fujiToday && <span>{Math.round(fujiToday.cloudCover)}% cloud · {Math.round(fujiToday.rain)}% rain</span>}<small>Estimate from forecast conditions over Mount Fuji</small></div>}<div className="forecast-strip">{location.days.map((day) => <article key={day.date}><time>{new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day.date}T00:00:00Z`))}</time>{day.rain >= 40 ? <CloudRain size={23} /> : <CloudSun size={23} />}<strong>{Math.round(day.max)}°</strong><span>{Math.round(day.min)}° · {day.rain}% rain</span><small>{weatherLabels[day.code] || 'Mixed'}</small></article>)}</div></section>
    })}</div>
  </div>
}