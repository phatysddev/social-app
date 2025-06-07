import { create } from "zustand";

interface UseUserStore {
    user: {
        id: string | null;
        username: string | null;
        avatar: string | null;
    },
    isLogin: boolean;
    setUser: (newUser: { id: string, username: string, avatar: string }) => void;
    setLogin: (status: boolean) => void; 
}

const useUserStore = create<UseUserStore>(set => ({
    user: {
        id: null,
        username: null,
        avatar: null
    },
    isLogin: false,
    setUser: (newUser) => set({ user: newUser }),
    setLogin: (status) => set({ isLogin: status })
}));

export default useUserStore;