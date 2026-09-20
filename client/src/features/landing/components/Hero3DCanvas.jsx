import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Animated DNA Double Helix 3D mesh
 */
const DnaHelix = () => {
  const groupRef = useRef()

  const { pointsA, pointsB, rungs } = useMemo(() => {
    const pA = []
    const pB = []
    const rng = []
    const numPoints = 28
    const radius = 1.3
    const height = 5.5

    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 3.5
      const y = (i / numPoints) * height - height / 2
      const x1 = Math.cos(t) * radius
      const z1 = Math.sin(t) * radius
      const x2 = Math.cos(t + Math.PI) * radius
      const z2 = Math.sin(t + Math.PI) * radius

      pA.push([x1, y, z1])
      pB.push([x2, y, z2])

      if (i % 2 === 0) {
        rng.push({ from: [x1, y, z1], to: [x2, y, z2] })
      }
    }
    return { pointsA: pA, pointsB: pB, rungs: rng }
  }, [])

  const elapsedRef = useRef(0)

  useFrame((_, delta) => {
    if (groupRef.current) {
      elapsedRef.current += delta
      groupRef.current.rotation.y += delta * 0.45
      groupRef.current.rotation.x = Math.sin(elapsedRef.current * 0.3) * 0.15
    }
  })

  return (
    <group ref={groupRef} scale={[0.85, 0.85, 0.85]}>
      {/* Strand A Nodes */}
      {pointsA.map((pos, i) => (
        <mesh key={`a-${i}`} position={pos}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color="#26A689"
            emissive="#1d7e68"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
      ))}

      {/* Strand B Nodes */}
      {pointsB.map((pos, i) => (
        <mesh key={`b-${i}`} position={pos}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color="#34D399"
            emissive="#10b981"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
      ))}

      {/* Connecting Rungs */}
      {rungs.map((rung, i) => {
        const p1 = new THREE.Vector3(...rung.from)
        const p2 = new THREE.Vector3(...rung.to)
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
        const length = p1.distanceTo(p2)
        const orientation = new THREE.Matrix4()
        orientation.lookAt(p1, p2, new THREE.Vector3(0, 1, 0))

        return (
          <mesh
            key={`rung-${i}`}
            position={[mid.x, mid.y, mid.z]}
            rotation={[
              Math.atan2(p2.y - p1.y, Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2)),
              Math.atan2(p2.x - p1.x, p2.z - p1.z),
              0,
            ]}
          >
            <cylinderGeometry args={[0.02, 0.02, length, 8]} />
            <meshStandardMaterial
              color="#a7f3d0"
              transparent
              opacity={0.45}
              roughness={0.4}
            />
          </mesh>
        )
      })}
    </group>
  )
}

/**
 * Floating Holographic Data Rings & Particles
 */
const FloatingParticles = () => {
  const particlesRef = useRef()

  const positions = useMemo(() => {
    const pos = new Float32Array(120 * 3)
    for (let i = 0; i < 120; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.06
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#26A689"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

const FallbackMolecularOrb = () => (
  <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
    <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-primary via-teal-400 to-emerald-400 opacity-20 blur-2xl animate-pulse" />
    <div className="absolute flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-3xl border-2 border-primary/40 bg-surface/80 backdrop-blur-xl flex items-center justify-center shadow-glow mb-4 animate-float">
        <svg className="w-12 h-12 text-primary" viewBox="0 0 48 48" fill="none">
          <path d="M24 8v32M8 24h32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="24" cy="24" r="6" fill="currentColor" />
        </svg>
      </div>
      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
        Molecular Intelligence Core
      </span>
      <span className="text-[11px] text-text-secondary mt-1">
        Real-time FHIR Clinical Data Pipeline
      </span>
    </div>
  </div>
)

export const Hero3DCanvas = () => {
  const [isContextLost, setIsContextLost] = React.useState(false)

  const hasWebGL = useMemo(() => {
    try {
      if (typeof window === 'undefined') return false
      const canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
    } catch {
      return false
    }
  }, [])

  if (!hasWebGL || isContextLost) {
    return <FallbackMolecularOrb />
  }

  return (
    <div className="w-full h-full relative min-h-[380px] sm:min-h-[460px] lg:min-h-[520px]">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-emerald-500/10 rounded-3xl blur-3xl pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'default',
        }}
        dpr={[1, 1.5]}
        className="w-full h-full"
        onCreated={({ gl }) => {
          const domElement = gl.domElement
          const handleContextLost = (e) => {
            e.preventDefault()
            setIsContextLost(true)
          }
          const handleContextRestored = () => {
            setIsContextLost(false)
          }
          domElement.addEventListener('webglcontextlost', handleContextLost, false)
          domElement.addEventListener('webglcontextrestored', handleContextRestored, false)
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 5, 4]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-4, -3, -2]} intensity={0.9} color="#26A689" />
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
          <DnaHelix />
        </Float>
        <FloatingParticles />
      </Canvas>
    </div>
  )
}

export default Hero3DCanvas
