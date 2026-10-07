import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

export const STORAGE_KEYS = {
  itinerary: 'japan-planner:itinerary:v1',
  budget: 'japan-planner:budget:v1',
  packing: 'japan-planner:packing:v1',
  transport: 'japan-planner:transport:v1',
  stays: 'japan-planner:stays:v1',
  food: 'japan-planner:food:v1',
  phrases: 'japan-planner:phrases:v1',
  weather: 'japan-planner:weather:v1',
}

function readStoredValue(key, initialValue) {
  try {
    const stored = window.localStorage.getItem(key)
    return stored === null ? initialValue : JSON.parse(stored)
  } catch {
    return initialValue
  }
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(key, initialValue))
  const [cloudUser, setCloudUser] = useState(null)
  const [cloudLoaded, setCloudLoaded] = useState(true)
  const initialValueRef = useRef(value)

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setCloudUser(user)
    setCloudLoaded(!user)
  }), [])

  useEffect(() => {
    if (!cloudUser) {
      return undefined
    }

    let active = true
    getDoc(doc(db, 'users', cloudUser.uid, 'planner', key)).then((snapshot) => {
      if (!active) return
      if (snapshot.exists()) {
        setValue(snapshot.data().value)
        window.localStorage.setItem(key, JSON.stringify(snapshot.data().value))
      } else {
        setDoc(doc(db, 'users', cloudUser.uid, 'planner', key), { value: initialValueRef.current })
      }
      setCloudLoaded(true)
    }).catch((error) => {
      console.error(`Could not load ${key} from Firestore.`, error)
      if (active) setCloudLoaded(true)
    })

    return () => { active = false }
  }, [cloudUser, key])

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Could not persist ${key} to localStorage.`, error)
    }
    if (cloudUser && cloudLoaded) {
      setDoc(doc(db, 'users', cloudUser.uid, 'planner', key), { value }).catch((error) => console.error(`Could not save ${key} to Firestore.`, error))
    }
  }, [cloudLoaded, cloudUser, key, value])

  return [value, setValue]
}

export function clearPlannerData() {
  Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
}