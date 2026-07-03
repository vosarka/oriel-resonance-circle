import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface SignalFieldProps {
  reducedMotion?: boolean;
}

function SignalField({ reducedMotion = false }: SignalFieldProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const sigilRef = useRef<THREE.Mesh>(null!);
  const ringsRef = useRef<THREE.Group>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const glitchRef = useRef<THREE.Mesh>(null!);

  // Load the exact sigil the user wants (cracked golden Psi)
  const sigilTexture = useTexture("/oriel-signal-mark.png");

  // Subtle energy wave rings (5 layers)
  const rings = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      radius: 1.1 + i * 0.28,
      speed: 0.08 + i * 0.015,
      phase: i * 1.2,
      opacity: 0.35 - i * 0.05,
    }));
  }, []);

  // Fine signal particles
  const particleCount = 420;
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 2.4;
      const y = (Math.random() - 0.5) * 2.8;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.6;

      speeds[i] = 0.2 + Math.random() * 0.9;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, speeds, phases };
  }, []);

  // Very subtle glitch plane (occasional elegant interference)
  const glitchUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColorShift: { value: new THREE.Vector3(1, 1, 1) },
    }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (reducedMotion) {
      // Very gentle breathing only
      if (sigilRef.current) {
        sigilRef.current.scale.setScalar(1 + Math.sin(t * 0.4) * 0.012);
      }
      return;
    }

    // === Central Sigil - slow elegant pulse + very slight rotation ===
    if (sigilRef.current) {
      const pulse = Math.sin(t * 0.55) * 0.018 + 1;
      sigilRef.current.scale.setScalar(pulse);
      sigilRef.current.rotation.z = Math.sin(t * 0.08) * 0.06;
    }

    // === Energy Waves (subtle, layered) ===
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const r = rings[i];
        const wave = Math.sin(t * r.speed + r.phase) * 0.035;
        ring.scale.setScalar(1 + wave);
        ring.rotation.z = t * (0.06 + i * 0.012) * (i % 2 === 0 ? 1 : -1);
        ring.rotation.x = Math.sin(t * 0.2 + i) * 0.08;
      });
    }

    // === Signal Particles - very fine interference ===
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const speed = particles.speeds[i];
        const phase = particles.phases[i];

        // Gentle wave motion
        const wave = Math.sin(t * speed * 0.6 + phase) * 0.022;
        const yWave = Math.cos(t * speed * 0.35 + phase * 1.3) * 0.018;

        // Very subtle radial breathing
        const radiusMod = 1 + Math.sin(t * 0.4 + phase) * 0.012;

        const x =
          (arr[idx] / (1 + Math.sin(t * 0.3 + phase) * 0.008)) * radiusMod;
        const z =
          (arr[idx + 2] / (1 + Math.sin(t * 0.3 + phase) * 0.008)) * radiusMod;

        arr[idx] = x;
        arr[idx + 1] = arr[idx + 1] * 0.995 + yWave * 0.6;
        arr[idx + 2] = z;
      }
      pos.needsUpdate = true;
    }

    // === Very rare, elegant multicolored glitch ===
    if (glitchRef.current && glitchUniforms) {
      const glitchTime = Math.sin(t * 0.7) * Math.cos(t * 0.3);
      const intensity = Math.max(0, glitchTime * 0.65 - 0.6) * 0.9; // very rare peaks

      glitchUniforms.uTime.value = t;
      glitchUniforms.uIntensity.value = intensity;

      // Subtle color shift during glitch moments
      const shift = intensity * 0.8;
      glitchUniforms.uColorShift.value.set(
        1 + shift * 0.6,
        1 - shift * 0.3,
        1 + shift * 0.9
      );
    }

    // Very slow overall breathing of the whole field
    if (groupRef.current) {
      const breathe = Math.sin(t * 0.22) * 0.008 + 1;
      groupRef.current.scale.setScalar(breathe);
    }
  });

  return (
    <group ref={groupRef}>
      {/* === Very subtle background interference field === */}
      <mesh position={[0, 0, -1.8]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial color="#0a0a0e" transparent opacity={0.65} />
      </mesh>

      {/* === Central Sigil (using the exact logo the user wants) === */}
      <mesh ref={sigilRef} position={[0, 0, 0]}>
        <planeGeometry args={[2.15, 2.15]} />
        <meshBasicMaterial
          map={sigilTexture}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* === Subtle Energy Waves (valuri de energie subtile) === */}
      <group ref={ringsRef}>
        {rings.map((ring, i) => (
          <mesh
            key={i}
            position={[0, 0, -0.35 - i * 0.08]}
            rotation={[1.2 + i * 0.07, 0, 0]}
          >
            <torusGeometry args={[ring.radius, 0.009, 18, 92]} />
            <meshBasicMaterial
              color={i % 3 === 0 ? "#f6b05e" : "#e8d9b8"}
              transparent
              opacity={ring.opacity}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* === Fine Signal Particles (very elegant interference) === */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.018}
          color="#f6b05e"
          transparent
          opacity={0.55}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* === Very subtle, rare multicolored glitch plane === */}
      <mesh ref={glitchRef} position={[0, 0, 0.6]}>
        <planeGeometry args={[8, 8]} />
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
            uniform vec3 uColorShift;
            varying vec2 vUv;

            void main() {
              vec2 uv = vUv;
              float glitch = uIntensity;

              // Very subtle horizontal displacement
              float disp = sin(uv.y * 38.0 + uTime * 18.0) * 0.004 * glitch;
              vec2 offset = vec2(disp, 0.0);

              // Elegant chromatic split (very low intensity)
              float r = glitch * 0.9;
              float g = glitch * 0.6;
              float b = glitch * 1.1;

              // Soft noise for texture
              float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);

              float alpha = glitch * (0.12 + noise * 0.08);

              gl_FragColor = vec4(
                r * uColorShift.r,
                g * uColorShift.g,
                b * uColorShift.b,
                alpha
              );
            }
          `}
        />
      </mesh>
    </group>
  );
}

interface SignalTransmissionCoreProps {
  reducedMotion?: boolean;
}

export default function SignalTransmissionCore({
  reducedMotion = false,
}: SignalTransmissionCoreProps) {
  return (
    <Canvas
      dpr={[1, 1.65]}
      camera={{ position: [0, 0, 4.8], fov: 46 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
      gl={{
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: false,
      }}
    >
      <SignalField reducedMotion={reducedMotion} />
    </Canvas>
  );
}
