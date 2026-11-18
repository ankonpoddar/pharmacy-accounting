import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export async function signUp(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName })
  }
  return userCredential.user
}

export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signInWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider)
  return userCredential.user
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

export async function changePassword(newPassword) {
  const user = auth.currentUser
  if (!user) throw new Error('No user signed in')
  await updatePassword(user, newPassword)
}

export async function updateUserProfile(data) {
  const user = auth.currentUser
  if (!user) throw new Error('No user signed in')
  await updateProfile(user, data)
  return user
}

export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser() {
  return auth.currentUser
}

export function isAuthenticated() {
  return !!auth.currentUser
}