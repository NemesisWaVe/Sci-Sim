'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, MeshTransmissionMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'

const flaskPoints = [
  new THREE.Vector2(0.00, 0.0),    // Bottom center
  new THREE.Vector2(1.50, 0.0),    // Bottom outer
  new THREE.Vector2(1.60, 0.1),    // Bottom rounded corner
  new THREE.Vector2(0.60, 2.4),    // Conical slant top
  new THREE.Vector2(0.40, 2.8),    // Neck curve
  new THREE.Vector2(0.40, 4.0),    // Neck top
  new THREE.Vector2(0.45, 4.0),    // Neck rim outer
  new THREE.Vector2(0.45, 4.1),    // Neck rim top
  new THREE.Vector2(0.35, 4.1),    // Neck rim inner top
  new THREE.Vector2(0.35, 2.8),    // Neck inner
  new THREE.Vector2(0.55, 2.4),    // Conical inner slant
  new THREE.Vector2(1.55, 0.15),   // Bottom inner corner
  new THREE.Vector2(1.45, 0.05),   // Bottom inner flat
  new THREE.Vector2(0.00, 0.05),   // Bottom inner center
]

const liquidPoints = [
  new THREE.Vector2(0.00, 0.05),
  new THREE.Vector2(1.45, 0.05),
  new THREE.Vector2(1.55, 0.15),
  new THREE.Vector2(0.55, 2.4),
  new THREE.Vector2(0.35, 2.8),
  new THREE.Vector2(0.35, 3.5), // liquid max height
]

function FlaskApparatus({ color, colorOpacity, fillPercent, drips, isStreaming }: { color: string, colorOpacity: number, fillPercent: number, drips: number[], isStreaming?: boolean }) {
  const liquidRef = useRef<THREE.Mesh>(null)
  
  // The plane that clips the liquid
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.1), [])
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)

  const glassGeometry = useMemo(() => new THREE.LatheGeometry(flaskPoints, 64), [])
  const liquidGeometry = useMemo(() => new THREE.LatheGeometry(liquidPoints, 64), [])

  useFrame((state, delta) => {
    // fillPercent goes from 0 to 1
    // max height is around 2.4 (base of the neck)
    const targetHeight = 0.1 + (fillPercent * 2.3)
    plane.constant = THREE.MathUtils.lerp(plane.constant, targetHeight, delta * 5)

    if (materialRef.current) {
      const currentColor = new THREE.Color(materialRef.current.color.getHex())
      const targetColor = new THREE.Color(color)
      // Slow down color lerp so the fluid "mixes" slower and doesn't instantly turn pink
      currentColor.lerp(targetColor, delta * 0.4)
      materialRef.current.color.copy(currentColor)
      
      // Interpolate opacity
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, Math.max(0.2, colorOpacity), delta * 0.4)
    }
  })

  // Enable local clipping on the renderer
  useFrame(({ gl }) => {
    gl.localClippingEnabled = true
  })

  return (
    <group position={[0, -2.4, 0]}>
      {/* Glass */}
      <mesh geometry={glassGeometry}>
        <MeshTransmissionMaterial
          thickness={0.2}
          roughness={0.05}
          transmission={1}
          ior={1.5}
          chromaticAberration={0.06}
          color="#ffffff"
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Liquid */}
      <mesh ref={liquidRef} geometry={liquidGeometry}>
        <meshPhysicalMaterial
          ref={materialRef}
          color={color}
          transmission={0.4}
          opacity={0.9}
          transparent
          roughness={0.1}
          ior={1.33}
          clippingPlanes={[plane]}
          side={THREE.DoubleSide}
        />
      </mesh>

      {isStreaming && (
        <Stream startY={5.8} endY={plane.constant} />
      )}

      {/* Drips */}
      {drips.map((id) => (
        <Drop key={id} startY={5.8} endY={plane.constant} />
      ))}
    </group>
  )
}

function Drop({ startY, endY }: { startY: number, endY: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const [splash, setSplash] = useState(false)
  
  useFrame((_, delta) => {
    if (ref.current && !splash) {
      ref.current.position.y -= delta * 8 // falling speed
      if (ref.current.position.y <= endY) {
        setSplash(true)
      }
    }
    if (ref.current && splash) {
      ref.current.scale.x += delta * 25
      ref.current.scale.z += delta * 25
      ref.current.scale.y = 0.05 // flatten into a ripple
      const mat = ref.current.material as THREE.MeshPhysicalMaterial
      mat.opacity -= delta * 3
      if (mat.opacity <= 0) {
        ref.current.visible = false
      }
    }
  })

  return (
    <mesh ref={ref} position={[0, startY, 0]}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshPhysicalMaterial color="#93c5fd" transmission={1} ior={1.33} roughness={0} transparent opacity={1} />
    </mesh>
  )
}

function Burette3D({ fillPercent }: { fillPercent: number }) {
  // fillPercent of the flask corresponds to the volume dispensed from the burette
  const liquidScale = Math.max(0.01, 1 - fillPercent)
  const liquidHeight = 3.8 * liquidScale
  // Move liquid down as it empties so it stays at the bottom of the tube
  const liquidY = 2.0 - (3.8 - liquidHeight) / 2
  
  return (
    <group position={[0, 4.0, 0]}>
      {/* Outer Glass Tube */}
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 4.0, 32]} />
        <MeshTransmissionMaterial thickness={0.1} roughness={0.05} transmission={1} ior={1.5} color="#ffffff" clearcoat={1} />
      </mesh>
      {/* Inner Liquid (blue) */}
      <mesh position={[0, liquidY, 0]}>
        <cylinderGeometry args={[0.18, 0.18, liquidHeight, 32]} />
        <meshPhysicalMaterial color="#93c5fd" transmission={0.2} opacity={0.8} transparent roughness={0.1} />
      </mesh>
      {/* Stopcock (valve) */}
      <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Nozzle tip */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.2, 0.05, 0.8, 16]} />
        <MeshTransmissionMaterial thickness={0.1} roughness={0.1} transmission={1} ior={1.5} />
      </mesh>
    </group>
  )
}

function Stream({ startY, endY }: { startY: number, endY: number }) {
  // A solid cylinder connecting the burette nozzle to the liquid surface
  const height = startY - endY
  const posY = endY + height / 2
  return (
    <mesh position={[0, posY, 0]}>
      <cylinderGeometry args={[0.03, 0.03, height, 16]} />
      <meshPhysicalMaterial color="#93c5fd" transmission={0.5} opacity={0.8} transparent roughness={0} />
    </mesh>
  )
}

export function Flask3D({ color, colorOpacity, baseVol, drips, isStreaming }: { color: string; colorOpacity: number; baseVol: number, drips: number[], isStreaming?: boolean }) {
  const fillPercent = Math.min(1, baseVol / 50)
  
  return (
    <div className="h-full w-full relative">
      <Canvas camera={{ position: [0, 1.5, 9], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <spotLight position={[-5, 5, 5]} intensity={1} angle={0.5} penumbra={1} />
        
        <Environment preset="studio" />
        
        <Burette3D fillPercent={fillPercent} />

        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <FlaskApparatus color={color} colorOpacity={colorOpacity} fillPercent={fillPercent} drips={drips} isStreaming={isStreaming} />
        </Float>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  )
}
