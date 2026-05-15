import { create } from 'zustand';

type AppState = {
  isDatabaseReady: boolean;
  setDatabaseReady: (ready: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  isDatabaseReady: false,
  setDatabaseReady: (ready) => set({ isDatabaseReady: ready }),
}));
