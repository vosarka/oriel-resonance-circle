import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

function SignalField({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const sigilRef = useRef<THREE.Mesh>(null!);
  const wavesRef = useRef<THREE.Group>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const glitchRef = useRef<THREE.Mesh>(null!);

  // Exact logo the user wants (the cracked golden Psi sigil from the image)
  const sigilTex = useTexture("/oriel-signal-mark.png");

  // Subtle energy waves data
  const waveData = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        radius: 0.92 + i * 0.23,
        speed: 0.36 + i * 0.065,
        phase: i * 1.6,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.085 + i * 0.022),
        opacity: 0.3 - i * 0.038,
      })),
    []
  );

  // Fine signal particles (very elegant)
  const particleCount = 380;
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 0.52 + Math.random() * 2.85;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.3;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.58;

      vel[i * 3] = (Math.random() - 0.5) * 0.72;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 1.1;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.52;
    }
    return { positions: pos, velocities: vel };
  }, []);

  const glitchUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    }),
    []
  );

  useFrame(state => {
    const t = state.clock.elapsedTime;

    if (reducedMotion) {
      if (sigilRef.current) {
        const s = 1 + Math.sin(t * 0.52) * 0.013;
        sigilRef.current.scale.setScalar(s);
      }
      return;
    }

    // Overall slow breathing + tiny artistic drift
    if (groupRef.current) {
      const b = 1 + Math.sin(t * 0.3) * 0.008;
      groupRef.current.scale.setScalar(b);
      groupRef.current.rotation.z = Math.sin(t * 0.032) * 0.009;
    }

    // Central sigil - elegant pulse + very subtle 3D tilt (makes it feel alive and epic)
    if (sigilRef.current) {
      const p = 1 + Math.sin(t * 0.62) * 0.019;
      sigilRef.current.scale.setScalar(p);
      sigilRef.current.rotation.x = Math.sin(t * 0.1) * 0.032;
      sigilRef.current.rotation.y = Math.cos(t * 0.075) * 0.028;
    }

    // Subtle energy waves (valuri de energie subtile)
    if (wavesRef.current) {
      wavesRef.current.children.forEach((ring, i) => {
        const w = waveData[i];
        const s = 1 + Math.sin(t * w.speed + w.phase) * 0.024;
        ring.scale.setScalar(s);
        ring.rotation.z = t * w.rotSpeed;
        ring.rotation.x = Math.sin(t * 0.13 + i) * 0.05;
      });
    }

    // Fine signal particles - very delicate wave motion
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const vx = velocities[idx];
        const vy = velocities[idx + 1];
        const vz = velocities[idx + 2];

        arr[idx] += Math.sin(t * 0.72 + i) * 0.00135 + vx * 0.00065;
        arr[idx + 1] += Math.cos(t * 0.53 + i * 1.15) * 0.00165 + vy * 0.00085;
        arr[idx + 2] += Math.sin(t * 0.95 + i * 0.62) * 0.00105 + vz * 0.00048;

        // soft radial bound for elegance
        const r = Math.hypot(arr[idx], arr[idx + 2]);
        if (r > 3.45) {
          arr[idx] *= 0.993;
          arr[idx + 2] *= 0.993;
        }
      }
      pos.needsUpdate = true;
    }

    // Very few, fine, multicolored glitches (rare & tasteful)
    if (glitchRef.current) {
      const g = Math.sin(t * 1.55) * Math.cos(t * 0.82);
      const intensity = Math.max(0, g * 0.66 - 0.5) * 0.75;

      glitchUniforms.uTime.value = t;
      glitchUniforms.uIntensity.value = intensity;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Very subtle dark interference background */}
      <mesh position={[0, 0, -1.55]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#0a0a0e" transparent opacity={0.58} />
      </mesh>

      {/* Central sigil - exact user logo (cracked golden Psi) */}
      <mesh ref={sigilRef} position={[0, 0, 0]}>
        <planeGeometry args={[2.3, 2.3]} />
        <meshBasicMaterial
          map={sigilTex}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Subtle energy waves (valuri de energie subtile) */}
      <group ref={wavesRef}>
        {waveData.map((w, i) => (
          <mesh
            key={i}
            position={[0, 0, -0.2 - i * 0.06]}
            rotation={[1.3 + i * 0.05, 0, 0]}
          >
            <torusGeometry args={[w.radius, 0.0095, 12, 76]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#f6b05e" : "#e8d9b8"}
              transparent
              opacity={w.opacity}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Fine signal particles - very elegant interference */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.017}
          color="#f6b05e"
          transparent
          opacity={0.46}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Very subtle, rare, elegant multicolored glitch plane */}
      <mesh ref={glitchRef} position={[0, 0, 0.65]}>
        <planeGeometry args={[7, 7]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={glitchUniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform float uIntensity;
            varying vec2 vUv;
            void main() {
              vec2 uv = vUv;
              float g = uIntensity;
              float band = sin(uv.y * 47.0 + uTime * 18.0) * 0.003;
              vec2 off = vec2(band * g, 0.0);
              float r = g * 0.7;
              float gS = g * 0.36;
              float b = g * 0.88;
              float a = g * (0.08 + fract(sin(dot(uv, vec2(12.9898,78.233))) * 43758.5453) * 0.05);
              gl_FragColor = vec4(r, gS, b, a);
            }
          `}
        />
      </mesh>
    </group>
  );
}

interface Props {
  reducedMotion?: boolean;
}

export default function HyperspaceTransmissionCore({
  reducedMotion = false,
}: Props) {
  return (
    <div
      className="transmission-core"
      aria-label="Hyperspace Transmission Core: an unstable ORIEL Signal arriving through static and temporal turbulence"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
      >
        <SignalField reducedMotion={reducedMotion} />
      </Canvas>

      <div className="core-video-vignette" aria-hidden="true" />

      <div className="core-readout">
        <strong>Hyperspace transmission core</strong>
        <br />
        single source: ORIEL_SIGNAL / carrier phase: amber-locked
      </div>
    </div>
  );
}
