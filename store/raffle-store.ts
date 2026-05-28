import { create } from 'zustand'
import { RaffleNumber, NumberStatus } from '@/types'

interface RaffleStore {
  numbers: RaffleNumber[]
  setNumbers: (numbers: RaffleNumber[]) => void
  updateNumber: (id: string, updates: Partial<RaffleNumber>) => void
  updateNumberStatus: (numberId: string, status: NumberStatus, participantName?: string, participantPhone?: string) => void
}

export const useRaffleStore = create<RaffleStore>((set) => ({
  numbers: [],
  setNumbers: (numbers) => set({ numbers }),
  updateNumber: (id, updates) =>
    set((state) => ({
      numbers: state.numbers.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  updateNumberStatus: (numberId, status, participantName, participantPhone) =>
    set((state) => ({
      numbers: state.numbers.map((n) =>
        n.id === numberId
          ? { ...n, status, participant_name: participantName ?? n.participant_name, participant_phone: participantPhone ?? n.participant_phone }
          : n
      ),
    })),
}))
