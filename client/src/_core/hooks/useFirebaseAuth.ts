import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import { auth, loginWithEmail, loginWithGoogle, logout as firebaseLogout, onAuthChange, getIdToken } from "@/lib/firebase";

interface AuthState {
    user: User | null;
    loading: boolean;
    error: Error | null;
    isAuthenticated: boolean;
}

export function useFirebaseAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
        isAuthenticated: false,
    });

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setState({
                user,
                loading: false,
                error: null,
                isAuthenticated: !!user,
            });
        });

        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const result = await loginWithEmail(email, password);
            return result.user;
        } catch (error) {
            setState((prev) => ({ ...prev, loading: false, error: error as Error }));
            throw error;
        }
    }, []);

    const loginGoogle = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const result = await loginWithGoogle();
            return result.user;
        } catch (error) {
            setState((prev) => ({ ...prev, loading: false, error: error as Error }));
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await firebaseLogout();
            // localStorage clean up if needed, but we don't store token there anymore
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    }, []);

    const refresh = useCallback(async () => {
        if (auth.currentUser) {
            await getIdToken();
        }
    }, []);

    return {
        ...state,
        login,
        loginGoogle,
        logout,
        refresh,
    };
}
