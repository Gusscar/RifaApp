'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Environment, Sphere } from '@react-three/drei'
import * as THREE from 'three'

const BALLS = [
  { position: [0, 0.5, 0] as [number, number, number], color: '#7c3aed', scale: 1.4, speed: 1.8, distort: 0.45, floatIntensity: 1.5 },
  { position: [2.2, -0.5, -1] as [number, number, number], color: '#f59e0b', scale: 1, speed: 2.2, distort: 0.3, floatIntensity: 2 },
  { position: [-2.2, 0.8, -0.5] as [number, number, number], color: '#ec4899', scale: 0.85, speed: 1.5, distort: 0.5, floatIntensity: 1.2 },
  { position: [1.5, 2, 0.5] as [number, number, number], color: '#3b82f6', scale: 0.7, speed: 2.5, distort: 0.35, floatIntensity: 2.5 },
  { position: [-1.2, -1.8, 0.2] as [number, number, number], color: '#10b981', scale: 0.9, speed: 1.9, distort: 0.4, floatIntensity: 1.8 },
  { position: [0.5, -2.5, -1] as [number, number, number], color: '#f43f5e', scale: 0.6, speed: 2.8, distort: 0.25, floatIntensity: 3 },
]

function Ball({
  position,
  color,
  scale,
  speed,
  distort,
  floatIntensity,
}: (typeof BALLS)[0]) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.3 * (speed / 2)
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.4 * (speed / 2)
  })

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={floatIntensity}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          speed={3}
          distort={distort}
          roughness={0.05}
          metalness={0.9}
          envMapIntensity={1.5}
        />
      </Sphere>
    </Float>
  )
}

export default function LotteryScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Environment preset="city" />
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} color="#7c3aed" intensity={3} />
      <pointLight position={[-5, -5, -5]} color="#f59e0b" intensity={2} />
      <pointLight position={[0, 8, 0]} color="#ffffff" intensity={1.5} />

      {BALLS.map((ball, i) => (
        <Ball key={i} {...ball} />
      ))}
    </Canvas>
  )
}
