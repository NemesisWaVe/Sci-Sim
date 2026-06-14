'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls, Line, Trail } from '@react-three/drei'
import * as THREE from 'three'

interface Pendulum3DProps {
  length: number
  gravity: number
  mass: number
  damping: number
  paused: boolean
  speed: number
  showTrail: boolean
  showVectors: boolean
  onMetricsUpdate: (metrics: { period: number; angle: number; velocity: number; ke: number; pe: number }) => void
  resetTrigger: number
}

function PendulumSystem({
  length,
  gravity,
  mass,
  damping,
  paused,
  speed,
  showTrail,
  showVectors,
  onMetricsUpdate,
  resetTrigger,
}: Pendulum3DProps) {
  const bobRef = useRef<THREE.Mesh>(null)
  const stringRef = useRef<THREE.Line>(null)
  
  // Physics state
  const state = useRef({ angle: Math.PI / 4, vel: 0 })
  const lastMetricsUpdate = useRef(0)

  // Reset when resetTrigger changes
  useEffect(() => {
    state.current = { angle: Math.PI / 4, vel: 0 }
  }, [resetTrigger])

  useFrame((_, delta) => {
    // 1. Physics integration
    if (!paused) {
      // Clamp delta to prevent spiraling on tab switch
      const dt = Math.min(delta, 0.05) * speed
      const steps = 4
      const sub = dt / steps
      for (let i = 0; i < steps; i++) {
        const acc = -(gravity / length) * Math.sin(state.current.angle) - damping * state.current.vel
        state.current.vel += acc * sub
        state.current.angle += state.current.vel * sub
      }
    }

    // 2. Update Transforms
    const a = state.current.angle
    // Scale length for visual purposes (e.g. 1m = 4 units)
    const visualLength = length * 4
    
    const x = visualLength * Math.sin(a)
    const y = -visualLength * Math.cos(a)

    if (bobRef.current) {
      bobRef.current.position.set(x, y, 0)
    }

    // 3. Metrics Throttle (10fps)
    const now = performance.now()
    if (now - lastMetricsUpdate.current > 100) {
      const vLinear = state.current.vel * length
      const height = length * (1 - Math.cos(a))
      onMetricsUpdate({
        period: 2 * Math.PI * Math.sqrt(length / gravity),
        angle: (a * 180) / Math.PI,
        velocity: vLinear,
        ke: 0.5 * mass * vLinear * vLinear,
        pe: mass * gravity * height,
      })
      lastMetricsUpdate.current = now
    }
  })

  // Calculate visual sizes
  const r = 0.2 + mass * 0.1
  const a = state.current.angle
  const visualLength = length * 4
  const bobX = visualLength * Math.sin(a)
  const bobY = -visualLength * Math.cos(a)
  
  const vLinear = state.current.vel * length
  const tensionMag = mass * gravity * Math.cos(a) + (mass * vLinear * vLinear) / length

  const bobMesh = (
    <mesh ref={bobRef} position={[bobX, bobY, 0]}>
      <sphereGeometry args={[r, 32, 32]} />
      <meshPhysicalMaterial color="#818cf8" metalness={0.9} roughness={0.1} clearcoat={1} />
    </mesh>
  )

  return (
    <group position={[0, 4, 0]}>
      {/* Pivot Stand */}
      <mesh position={[0, 0, -1]}>
        <boxGeometry args={[4, 0.2, 2]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* String */}
      <Line
        ref={stringRef}
        points={[[0, 0, 0], [bobX, bobY, 0]]}
        color="#cbd5e1"
        lineWidth={2}
      />
      {/* Fallback string visual update inside useFrame */}
      <primitive object={new THREE.Object3D()} />
      
      {/* Need a component to continuously update the string line, so we do it in useFrame */}
      <Updater stringRef={stringRef} bobRef={bobRef} />

      {/* Bob with Trail */}
      {showTrail ? (
        <Trail
          width={4}
          color="#6366f1"
          length={80}
          decay={1}
          local={false}
        >
          {bobMesh}
        </Trail>
      ) : (
        bobMesh
      )}

      {/* Vectors Overlay */}
      {showVectors && (
        <VectorsOverlay 
          bobRef={bobRef} 
          stateRef={state} 
          mass={mass} 
          gravity={gravity} 
          length={length} 
        />
      )}
    </group>
  )
}

function Updater({ stringRef, bobRef }: { stringRef: any, bobRef: any }) {
  useFrame(() => {
    if (stringRef.current && bobRef.current) {
      const pos = bobRef.current.position
      stringRef.current.geometry.setPositions([0, 0, 0, pos.x, pos.y, pos.z])
    }
  })
  return null
}

function VectorsOverlay({ bobRef, stateRef, mass, gravity, length }: { bobRef: any, stateRef: any, mass: number, gravity: number, length: number }) {
  const gLine = useRef<any>(null)
  const vLine = useRef<any>(null)
  const tLine = useRef<any>(null)

  useFrame(() => {
    if (!bobRef.current) return
    const pos = bobRef.current.position
    const a = stateRef.current.angle
    const vel = stateRef.current.vel

    // Gravity vector (downwards)
    if (gLine.current) {
      gLine.current.geometry.setPositions([pos.x, pos.y, pos.z, pos.x, pos.y - gravity * 0.2, pos.z])
    }

    // Velocity vector (tangent)
    if (vLine.current) {
      const vx = Math.cos(a) * vel * length * 0.5
      const vy = -Math.sin(a) * vel * length * 0.5
      vLine.current.geometry.setPositions([pos.x, pos.y, pos.z, pos.x + vx, pos.y + vy, pos.z])
    }

    // Tension vector (towards pivot)
    if (tLine.current) {
      const vLinear = vel * length
      const tension = mass * gravity * Math.cos(a) + (mass * vLinear * vLinear) / length
      const tx = -Math.sin(a) * tension * 0.1
      const ty = Math.cos(a) * tension * 0.1
      tLine.current.geometry.setPositions([pos.x, pos.y, pos.z, pos.x + tx, pos.y + ty, pos.z])
    }
  })

  return (
    <group>
      <Line ref={gLine} points={[[0,0,0], [0,0,0]]} color="#34d399" lineWidth={3} />
      <Line ref={vLine} points={[[0,0,0], [0,0,0]]} color="#fbbf24" lineWidth={3} />
      <Line ref={tLine} points={[[0,0,0], [0,0,0]]} color="#60a5fa" lineWidth={3} />
    </group>
  )
}

function PlanetSurface({ gravity }: { gravity: number }) {
  const getPlanetConfig = () => {
    if (Math.abs(gravity - 9.8) < 0.1) return { name: 'earth', color: '#166534', roughness: 0.9, metalness: 0.1 } // Earth: dark green
    if (Math.abs(gravity - 1.6) < 0.1) return { name: 'moon', color: '#94a3b8', roughness: 0.8, metalness: 0.2 } // Moon: dusty grey
    if (Math.abs(gravity - 3.7) < 0.1) return { name: 'mars', color: '#7f1d1d', roughness: 0.9, metalness: 0.1 } // Mars: dark red rust
    if (Math.abs(gravity - 24.8) < 0.1) return { name: 'jupiter', color: '#b45309', roughness: 0.5, metalness: 0.3 } // Jupiter: brownish
    return { name: 'unknown', color: '#475569', roughness: 0.8, metalness: 0.2 }
  }

  const p = getPlanetConfig()

  const jupiterTex = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    for (let y = 0; y < 256; y++) {
      const noise = Math.sin(y * 0.1) + Math.sin(y * 0.05) * 0.5
      let color = ''
      if (noise > 0.8) color = '#78350f'
      else if (noise > 0.2) color = '#b45309'
      else if (noise > -0.4) color = '#fcd34d'
      else color = '#fef3c7'
      ctx.fillStyle = color
      ctx.fillRect(0, y, 1, 1)
    }
    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <group position={[0, -120, 0]}>
      <mesh>
        <sphereGeometry args={[110, 64, 64]} />
        {p.name === 'jupiter' && jupiterTex ? (
           <meshStandardMaterial map={jupiterTex} roughness={0.6} metalness={0.1} />
        ) : (
           <meshStandardMaterial color={p.color} roughness={p.roughness} metalness={p.metalness} />
        )}
      </mesh>
      {p.name === 'jupiter' && (
        <mesh scale={1.02}>
          <sphereGeometry args={[110, 64, 64]} />
          <meshStandardMaterial color="#fcd34d" transparent opacity={0.15} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

export function Pendulum3D(props: Pendulum3DProps) {
  const getSkyColor = () => {
    if (Math.abs(props.gravity - 9.8) < 0.1) return '#38bdf8' // Earth
    if (Math.abs(props.gravity - 1.6) < 0.1) return '#050505' // Moon
    if (Math.abs(props.gravity - 3.7) < 0.1) return '#ea580c' // Mars: vibrant dusty orange/red
    if (Math.abs(props.gravity - 24.8) < 0.1) return '#fcd34d' // Jupiter
    return '#0f172a'
  }

  const skyColor = getSkyColor()

  return (
    <div className="h-full w-full relative rounded-xl overflow-hidden transition-colors duration-1000">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <color attach="background" args={[skyColor]} />
        <fog attach="fog" args={[skyColor, 15, 60]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <spotLight position={[-5, 5, 10]} intensity={2} penumbra={1} />
        <Environment preset="studio" />
        
        <PlanetSurface gravity={props.gravity} />
        <PendulumSystem {...props} />
        
        <OrbitControls enablePan={true} enableZoom={true} minDistance={5} maxDistance={30} maxPolarAngle={Math.PI / 2 + 0.1} />
      </Canvas>
    </div>
  )
}
