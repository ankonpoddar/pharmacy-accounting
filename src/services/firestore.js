import {
  collection, addDoc, getDocs, doc, updateAndDelete, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

const getCollection = (name) => collection(db, name)

export async function addFirestoreDoc(collectionName, data) {
  if (!db) return offlineStore(collectionName, 'add', data)
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (err) {
    console.warn('Firestore offline, fallback to local:', err)
    return offlineStore(collectionName, 'add', data)
  }
}

export async function getFirestoreDocs(collectionName) {
  if (!db) return getOfflineStore(collectionName)
  try {
    const snapshot = await getDocs(collection(db, collectionName))
    const list = []
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() })
    })
    return list
  } catch (err) {
    console.warn('Firestore fetch offline, fallback:', err)
    return getOfflineStore(collectionName)
  }
}

export async function deleteFirestoreDoc(collectionName, id) {
  if (!db) return deleteOfflineStore(collectionName, id)
  try {
    await deleteDoc(doc(db, collectionName, id))
    return true
  } catch (err) {
    return deleteOfflineStore(collectionName, id)
  }
}

// Fallback localStorage offline queue
function offlineStore(col, action, data) {
  const key = `pharmacy_${col}`
  const items = JSON.parse(localStorage.getItem(key) || '[]')
  const item = { id: 'local_' + Date.now(), ...data, createdAt: new Date().toISOString() }
  items.push(item)
  localStorage.setItem(key, JSON.stringify(items))
  return item.id
}

function getOfflineStore(col) {
  const key = `pharmacy_${col}`
  return JSON.parse(localStorage.getItem(key) || '[]')
}

function deleteOfflineStore(col, id) {
  const key = `pharmacy_${col}`
  let items = JSON.parse(localStorage.getItem(key) || '[]')
  items = items.filter(i => i.id !== id)
  localStorage.setItem(key, JSON.stringify(items))
  return true
}