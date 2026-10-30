import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where, type DocumentData } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'

function requireFirestore() {
  if (!firestore) throw new Error('Firestore is not configured.')
  return firestore
}

export async function listCollection<T>(name: string, constraints: ReturnType<typeof where>[] = [], sortField = 'created_at'): Promise<T[]> {
  const ref = collection(requireFirestore(), name)
  const result = await getDocs(query(ref, ...constraints, orderBy(sortField, 'desc'), limit(100)))
  return result.docs.map((item) => ({ id: item.id, ...item.data() }) as T)
}

export function watchCollection<T>(name: string, onData: (rows: T[]) => void, sortField = 'created_at') {
  return onSnapshot(query(collection(requireFirestore(), name), orderBy(sortField, 'desc'), limit(100)), (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)))
}

export async function createRecord(name: string, value: DocumentData) { return addDoc(collection(requireFirestore(), name), { ...value, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }) }
export async function updateRecord(name: string, id: string, value: DocumentData) { return updateDoc(doc(requireFirestore(), name, id), { ...value, updated_at: new Date().toISOString() }) }
export async function removeRecord(name: string, id: string) { return deleteDoc(doc(requireFirestore(), name, id)) }
export async function findRecords<T>(name: string, field: string, value: string): Promise<T[]> { const result = await getDocs(query(collection(requireFirestore(), name), where(field, '==', value), limit(100))); return result.docs.map((item) => ({ id: item.id, ...item.data() }) as T) }
export async function upsertRecord(name: string, id: string, value: DocumentData) { return setDoc(doc(requireFirestore(), name, id), { ...value, updated_at: new Date().toISOString() }, { merge: true }) }
