import { createContext, useState, useContext, useEffect } from 'react';
//Updated to use the new firebase.js
import { auth } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Sign up function
    const signup = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Login function
    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Set up auth state observer
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        loading,
        error,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 