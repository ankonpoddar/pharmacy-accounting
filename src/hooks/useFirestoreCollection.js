import { useState, useEffect, useCallback } from 'react'
import { db } from '../services/firebase'
import {
  collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'

export function useFirestoreCollection(collectionName, dateFilter = null) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!db) {
      // Offline fallback - load from localStorage
      const local = JSON.parse(localStorage.getItem(`pharmacy_${collectionName}`) || '[]')
      setData(local.filter(item => !dateFilter || item.date === dateFilter))
      setLoading(false)
      return
    }

    let q = collection(db, collectionName)
    const constraints = [orderBy('createdAt', 'desc')]

    if (dateFilter) {
      constraints.unshift(where('date', '==', dateFilter))
    }

    q = query(q, ...constraints)

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = []
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() })
      })
      setData(items)
      setLoading(false)

      // Also cache to localStorage for offline
      localStorage.setItem(`pharmacy_${collectionName}`, JSON.stringify(items))
    }, (err) => {
      console.warn('Firestore listener error:', err)
      setError(err)
      // Fallback to localStorage
      const local = JSON.parse(localStorage.getItem(`pharmacy_${collectionName}`) || '[]')
      setData(local.filter(item => !dateFilter || item.date === dateFilter))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [collectionName, dateFilter])

  const add = useCallback(async (item) => {
    const payload = { ...item, createdAt: serverTimestamp() }
    if (!db) {
      const id = 'local_' + Date.now()
      const newItem = { id, ...payload, createdAt: new Date().toISOString() }
      setData((prev) => [newItem, ...prev])
      // Update localStorage
      const local = JSON.parse(localStorage.getItem(`pharmacy_${collectionName}`) || '[]')
      local.unshift(newItem)
      localStorage.setItem(`pharmacy_${collectionName}`, JSON.stringify(local))
      return id
    }
    try {
      const docRef = await addDoc(collection(db, collectionName), payload)
      return docRef.id
    } catch (err) {
      console.warn('Add failed, using offline:', err)
      const id = 'local_' + Date.now()
      const newItem = { id, ...payload, createdAt: new Date().toISOString() }
      setData((prev) => [newItem, ...prev])
      const local = JSON.parse(localStorage.getItem(`pharmacy_${collectionName}`) || '[]')
      local.unshift(newItem)
      localStorage.setItem(`pharmacy_${collectionName}`, JSON.stringify(local))
      return id
    }
  }, [collectionName])

  const remove = useCallback(async (id) => {
    if (!db) {
      setData((prev) => prev.filter((d) => d.id !== id))
      const local = JSON.parse(localStorage.getItem(`pharmacy_${collectionName}`) || '[]')
      const filtered = local.filter((d) => d.id !== id)
      localStorage.setItem(`pharmacy_${collectionName}`, JSON.stringify(filtered))
      return
    }
    try {
      await deleteDoc(doc(db, collectionName, id))
    } catch (err) {
      console.warn('Delete failed, using offline:', err)
      setData((prev) => prev.filter((d) => d.id !== id))
      const local = JSON.parse(localStorage.getItem(`pharmacy_${collectionName}`) || '[]')
      const filtered = local.filter((d) => d.id !== id)
      localStorage.setItem(`pharmacy_${collectionName}`, JSON.stringify(filtered))
    }
  }, [collectionName])

  return { data, loading, error, add, remove }
}