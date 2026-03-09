import { 
  collection, doc, setDoc, getDocs, updateDoc, deleteDoc, 
  query, where, onSnapshot, addDoc, writeBatch
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Bed, BedAssignment } from "../types";

const BEDS_COLLECTION = "beds";
const ASSIGNMENTS_COLLECTION = "bed_assignments";

export const fetchBeds = async (): Promise<Bed[]> => {
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, BEDS_COLLECTION));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed));
};

export const subscribeToBeds = (callback: (beds: Bed[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, BEDS_COLLECTION), (snapshot) => {
    const beds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed));
    callback(beds);
  });
};

export const subscribeToAssignments = (callback: (assignments: BedAssignment[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, ASSIGNMENTS_COLLECTION), (snapshot) => {
    const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BedAssignment));
    callback(assignments);
  });
};

export const bulkCreateBeds = async (count: number) => {
  if (!db) return;
  const batch = writeBatch(db);
  const existingBeds = await fetchBeds();
  const startNumber = existingBeds.length > 0 
    ? Math.max(...existingBeds.map(b => parseInt(b.bedNumber.replace(/\D/g, '')) || 0)) + 1 
    : 1;

  for (let i = 0; i < count; i++) {
    const bedNumber = `G${(startNumber + i).toString().padStart(3, '0')}`;
    const bedRef = doc(collection(db, BEDS_COLLECTION));
    batch.set(bedRef, {
      bedNumber,
      status: 'available'
    });
  }
  await batch.commit();
};

export const updateBed = async (id: string, data: Partial<Bed>) => {
  if (!db) return;
  const bedRef = doc(db, BEDS_COLLECTION, id);
  await updateDoc(bedRef, data);
};

export const deleteBed = async (id: string) => {
  if (!db) return;
  const bedRef = doc(db, BEDS_COLLECTION, id);
  await deleteDoc(bedRef);
};

export const assignBed = async (assignment: Omit<BedAssignment, 'id'>, bookingId?: string) => {
  if (!db) return;
  // 1. Create assignment
  const docRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), {
    ...assignment,
    status: 'active'
  });

  // 2. Update bed status
  const bedRef = doc(db, BEDS_COLLECTION, assignment.bedId);
  await updateDoc(bedRef, { status: 'occupied' });

  // 3. Update booking if provided
  if (bookingId) {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      needsInpatient: false,
      isAdmitted: true
    });
  }

  return docRef.id;
};

export const dischargePatient = async (assignmentId: string, bedId: string) => {
  if (!db) return;
  // 1. Update assignment status
  const assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
  await updateDoc(assignmentRef, { status: 'discharged' });

  // 2. Update bed status
  const bedRef = doc(db, BEDS_COLLECTION, bedId);
  await updateDoc(bedRef, { status: 'available' });
};

export const getOccupancyForDate = async (date: string) => {
  if (!db) return [];
  // date format: YYYY-MM-DD
  const q = query(
    collection(db, ASSIGNMENTS_COLLECTION)
  );
  
  const snapshot = await getDocs(q);
  const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BedAssignment));
  
  // Filter by date: assignment is active on this date if date is between start and end
  return assignments.filter(a => {
    const start = a.startTime.split('T')[0];
    const end = a.expectedEndTime.split('T')[0];
    return date >= start && date <= end && a.status === 'active';
  });
};
