'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'

function createMinecraftTexture(type: 'grass' | 'dirt' | 'side') {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext('2d')!
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      let color = ''
      if (type === 'grass') {
        const shade = 100 + Math.random() * 50
        color = `rgb(0, ${shade}, 0)`
      } else if (type === 'dirt') {
        const shade = 50 + Math.random() * 30
        color = `rgb(${shade + 40}, ${shade + 20}, ${shade / 2})`
      } else {
        if (y < 4 || (y < 6 && Math.random() > 0.5)) {
          const shade = 100 + Math.random() * 50
          color = `rgb(0, ${shade}, 0)`
        } else {
          const shade = 50 + Math.random() * 30
          color = `rgb(${shade + 40}, ${shade + 20}, ${shade / 2})`
        }
      }
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

interface Projectile3DProps {
  angle: number
  velocity: number
  gravity: number
  isLaunched: boolean
  progress: number
  showComponents: boolean
  showGrid: boolean
}

function Ground({ range }: { range: number }) {
  const size = Math.max(range * 1.2, 50)
  
  const materials = useMemo(() => {
    if (typeof document === 'undefined') return []
    const top = createMinecraftTexture('grass')
    if (top) top.repeat.set(size, size / 3)
    
    const bottom = createMinecraftTexture('dirt')
    if (bottom) bottom.repeat.set(size, size / 3)
    
    const sideX = createMinecraftTexture('side')
    if (sideX) sideX.repeat.set(size / 3, 4)
    
    const sideZ = createMinecraftTexture('side')
    if (sideZ) sideZ.repeat.set(size, 4)
    
    return [
      new THREE.MeshStandardMaterial({ map: sideX, roughness: 1 }),
      new THREE.MeshStandardMaterial({ map: sideX, roughness: 1 }),
      new THREE.MeshStandardMaterial({ map: top, roughness: 1 }),
      new THREE.MeshStandardMaterial({ map: bottom, roughness: 1 }),
      new THREE.MeshStandardMaterial({ map: sideZ, roughness: 1 }),
      new THREE.MeshStandardMaterial({ map: sideZ, roughness: 1 }),
    ]
  }, [size])

  return (
    <group position={[size / 2 - 10, -1, 0]}>
      {materials.length > 0 ? (
        <mesh position={[0, -1, 0]} material={materials}>
          <boxGeometry args={[size, 4, size / 3]} />
        </mesh>
      ) : (
        <mesh position={[0, -1, 0]}>
          <boxGeometry args={[size, 4, size / 3]} />
          <meshStandardMaterial color="#4ade80" />
        </mesh>
      )}
    </group>
  )
}

function DynamicCamera({ range, height }: { range: number, height: number }) {
  const { camera } = useThree()
  
  useFrame(() => {
    const targetZ = Math.max(range * 0.8, height * 1.5, 40)
    const targetX = range / 2
    const targetY = height / 2 + 5
    
    camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05)
    camera.lookAt(targetX, targetY, 0)
  })
  
  return null
}

function Trajectory({ angle, velocity, gravity }: { angle: number, velocity: number, gravity: number }) {
  const points = useMemo(() => {
    const rad = (angle * Math.PI) / 180
    const vx = velocity * Math.cos(rad)
    const vy = velocity * Math.sin(rad)
    const T = (2 * vy) / gravity
    
    const pts = []
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * T
      const x = vx * t
      const y = Math.max(0, vy * t - 0.5 * gravity * t * t)
      pts.push(new THREE.Vector3(x, y + 1, 0)) // +1 for ground
      if (y <= 0 && i > 0) break
    }
    return pts
  }, [angle, velocity, gravity])

  return (
    <Line 
      points={points} 
      color="#a78bfa" 
      lineWidth={2} 
      dashed 
      dashScale={5} 
      dashSize={1} 
      gapSize={1} 
      transparent 
      opacity={0.6} 
    />
  )
}

function Projectile({ angle, velocity, gravity, progress, showComponents }: Projectile3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const rad = (angle * Math.PI) / 180
  const vx = velocity * Math.cos(rad)
  const vy = velocity * Math.sin(rad)
  const T = (2 * vy) / gravity
  
  const tCur = progress * T
  const curX = vx * tCur
  const curY = Math.max(0, vy * tCur - 0.5 * gravity * tCur * tCur)
  const curVy = vy - gravity * tCur
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(curX, curY + 1, 0) // +1 to account for ground level
      // Rotate ball to simulate spinning
      if (progress > 0 && progress < 1) {
        meshRef.current.rotation.z -= 0.1
      }
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshPhysicalMaterial color="#ef4444" metalness={0.4} roughness={0.2} clearcoat={0.8} />
      </mesh>

      {/* Vectors */}
      {showComponents && progress > 0 && progress < 1 && (
        <group position={[curX, curY + 1, 0]}>
          {/* Vx */}
          <Line points={[[0, 0, 0], [vx * 0.5, 0, 0]]} color="#34d399" lineWidth={3} />
          {/* Vy */}
          <Line points={[[0, 0, 0], [0, curVy * 0.5, 0]]} color="#fb923c" lineWidth={3} />
        </group>
      )}
    </group>
  )
}

function Grid({ range }: { range: number }) {
  const size = Math.max(range * 1.2, 50)
  return (
    <gridHelper args={[size, 20, 0xffffff, 0xffffff]} position={[size/2 - 10, 0.01, 0]} material-opacity={0.1} material-transparent />
  )
}

export function Projectile3D(props: Projectile3DProps) {
  const rad = (props.angle * Math.PI) / 180
  const vy = props.velocity * Math.sin(rad)
  const range = (props.velocity * props.velocity * Math.sin(2 * rad)) / props.gravity
  const height = (vy * vy) / (2 * props.gravity)

  return (
    <div className="h-full w-full relative bg-gradient-to-b from-sky-900/20 to-indigo-950/40 rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 5, 30], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={2} castShadow />
        <Environment preset="city" />
        
        <DynamicCamera range={range} height={height} />
        
        <Ground range={range} />
        {props.showGrid && <Grid range={range} />}
        
        <group position={[-10, 0, 0]}>
          {/* Launcher Cannon */}
          <group position={[0, 1, 0]} rotation={[0, 0, rad]}>
            {/* Barrel */}
            <mesh position={[2.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[1.2, 1.8, 5, 32]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Muzzle */}
            <mesh position={[5.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[1.4, 1.2, 0.8, 32]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Pivot Joint */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[1.5, 32, 32]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
          {/* Base Mount */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[4, 1, 4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Wheels */}
          <mesh position={[0, 0.5, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.4, 1.4, 0.6, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.5, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.4, 1.4, 0.6, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          <Trajectory angle={props.angle} velocity={props.velocity} gravity={props.gravity} />
          <Projectile {...props} />
        </group>
        
        <OrbitControls enablePan={false} enableZoom={true} minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  )
}
