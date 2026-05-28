export type NumberStatus = 'available' | 'reserved' | 'paid'

export interface Raffle {
  id: string
  user_id: string
  title: string
  description: string | null
  slug: string
  cover_image: string | null
  lottery_name: string | null
  draw_date: string | null
  draw_time: string | null
  digits: 2 | 3
  number_price: number | null
  whatsapp: string | null
  created_at: string
  prizes?: Prize[]
}

export interface Prize {
  id: string
  raffle_id: string
  position: 1 | 2 | 3
  title: string | null
  image: string | null
}

export interface RaffleNumber {
  id: string
  raffle_id: string
  number: string
  participant_name: string | null
  participant_phone: string | null
  status: NumberStatus
  reserved_at: string | null
  created_at: string
}

export interface ReservationPayload {
  name: string
  phone: string
  number: string
}
