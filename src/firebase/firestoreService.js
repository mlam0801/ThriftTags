import { db } from './config';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from 'firebase/firestore';

export const createUserProfile = async (userId, userData) => {
    await setDoc(doc(db, 'users', userId), userData);
};

export const getUserProfile = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
};

export const updateUserProfile = async (userId, updates) => {
    await updateDoc(doc(db, 'users', userId), updates);
};

export const getEvents = async (filters = {}) => {
    const eventsRef = collection(db, 'events');
    let q = query(eventsRef);
    
    if (filters.privacy) {
        q = query(q, where('privacy', '==', filters.privacy));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}; 