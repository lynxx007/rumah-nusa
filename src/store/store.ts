import { create } from "zustand";


interface State {
    isMapView: boolean
    setIsMapView: (value: boolean) => void
}
export const useStore = create<State>((set) => ({
    isMapView: false,
    setIsMapView: (value) => set((state) => ({ isMapView: value })),
}));