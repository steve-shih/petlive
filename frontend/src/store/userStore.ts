import { create } from 'zustand';

export type UserRole = 'BUYER' | 'SELLER' | null;

interface UserState {
  user: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
  login: (id: string, name: string, role: UserRole) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null, // Start logged out
  login: (id, name, role) => set({ user: { id, name, role } }),
  logout: () => set({ user: null }),
}));
