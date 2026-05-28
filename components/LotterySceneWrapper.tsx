'use client'

import dynamic from 'next/dynamic'

const LotteryScene = dynamic(() => import('@/components/LotteryScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-3xl bg-gradient-to-br from-violet-600/20 to-blue-900/20 animate-pulse" />
  ),
})

export function LotterySceneWrapper() {
  return <LotteryScene />
}
