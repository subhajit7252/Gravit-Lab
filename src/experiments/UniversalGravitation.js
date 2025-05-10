import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';

const G = 6.67430e-11;

function OrbitingBody({ m1, r, type }) {
    const [orbitalSpeed, setOrbitalSpeed] = useState(0);
  const meshRef = useRef();
  const lightRef = useRef();
  const labelRef = useRef();

  const time = useRef(0);
  const lastParams = useRef({ m1: null, r: null });
  const a = useRef(0); // semi-major axis
  const b = useRef(0); // semi-minor axis
  const e = 0.5; // orbital eccentricity (can be made dynamic later)
  const angularSpeed = useRef(0);
  const trail = useRef([]);
  const trailRef = useRef();
  const trailLimit = 200;
  const visualSpeedBoost = 1e4;

  const getScaledA = (r) => {
    if (r < 1e6) return 5;
    if (r < 1e8) return 20;
    return 40;
  };

  useFrame((_, delta) => {
    if (m1 !== lastParams.current.m1 || r !== lastParams.current.r) {
      time.current = 0;
      a.current = getScaledA(r);
      b.current = a.current * Math.sqrt(1 - e * e);
      angularSpeed.current = r > 0 ? (Math.sqrt(G * m1 / r) / r / 1000) * visualSpeedBoost : 0;
      trail.current = [];
      lastParams.current = { m1, r };
    }

    time.current += delta;
    const theta = angularSpeed.current * time.current;

    const x = a.current * Math.cos(theta);
    const y = b.current * Math.sin(theta);
    const scaledR = Math.sqrt(x * x + y * y);

    const speed = Math.sqrt(G * m1 * ((2 / scaledR) - (1 / a.current)));

   
     setOrbitalSpeed(speed);
 

     if (meshRef.current?.position) {
    meshRef.current.position.set(x, y, 0);
  }

   if (lightRef.current?.position) {
    lightRef.current.position.set(x, y, 0);
  }

   

    trail.current.push(new THREE.Vector3(x, y, 0));
    if (trail.current.length > trailLimit) trail.current.shift();

    if (trailRef.current) {
      const positions = new Float32Array(trail.current.length * 3);
      trail.current.forEach((v, i) => {
        positions[i * 3] = v.x;
        positions[i * 3 + 1] = v.y;
        positions[i * 3 + 2] = v.z;
      });

      trailRef.current.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      trailRef.current.geometry.setDrawRange(0, trail.current.length);
      trailRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
    <group ref={meshRef}>
      <mesh ref={meshRef}>
  <sphereGeometry args={[1.6, 32, 32]} />
  <meshStandardMaterial
    color={type === 'gas' ? '#ffffff' : '#f39c12'}
    emissive={type === 'gas' ? '#ffffff' : '#f39c12'}
    roughness={type === 'gas' ? 1 : 0.3}
    metalness={type === 'gas' ? 0.05 : 0.8}
    emissiveIntensity={type === 'gas' ? 1.1 : 0.5}
  /> 
</mesh>

 {/* ✅ THIS is the working label, moves with the mesh */}
  
</group>

      {type === 'gas' && (
        <pointLight ref={lightRef} intensity={1.5} distance={15} color="#ffffff" />
      )}   


      <Html center distanceFactor={12}>
    <div style={{
      background: '#111',
      color: '#0f0',
      fontSize: '12px',
      padding: '2px 4px',
      borderRadius: '4px',
      fontFamily: 'monospace'
    }}>
      Speed: {orbitalSpeed.toFixed(2)} m/s
    </div>
  </Html> 

       
     


      <line ref={trailRef}>
        <bufferGeometry />
        <lineBasicMaterial color="white" linewidth={2} />
      </line>
    </>
  );
}

function GravitySimulation({ m1, m2, r, type1, type2 }) {
  let centerMass = m1;
  let orbitMass = m2;
  let reversed = false;

  if (m2 > m1) {
    centerMass = m2;
    orbitMass = m1;
    reversed = true;
  }

  const force = (G * centerMass * orbitMass) / (r * r);
  const velocity = Math.sqrt(G * centerMass / r);

  const typeMaterial = (type, color) => ({
    color,
    emissive: color,
    roughness: type === 'gas' ? 0.95 : 0.3,
    metalness: type === 'gas' ? 0.1 : 0.8,
    emissiveIntensity: type === 'gas' ? 0.8 : 0.5,
  });

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshStandardMaterial {...typeMaterial(reversed ? type2 : type1, 'blue')} />
      </mesh>
      {(reversed ? type2 : type1) === 'gas' && (
        <pointLight position={[0, 0, 0]} intensity={1.2} distance={20} color="#00ccff" />
      )}

      <OrbitingBody m1={centerMass} r={r} type={reversed ? type1 : type2} />

      <Html position={[0, 4, 0]}>
        <div style={{ background: '#111', color: '#0f0', padding: '6px', borderRadius: '4px', fontFamily: 'monospace' }}>
          <div>Force: {force.toExponential(2)} N</div>
          <div>Velocity (avg): {velocity.toFixed(2)} m/s</div>
          <div>Distance: {r.toLocaleString()} m</div>
        </div>
      </Html>
    </group>
  );
}

function UniversalGravitation() {
  const [mass1, setMass1] = useState(5.972e24);
  const [mass2, setMass2] = useState(7.348e22);
  const [distance, setDistance] = useState(384400000);
  const [type1, setType1] = useState('solid');
  const [type2, setType2] = useState('solid');

  return (
    <div className="bg-black h-screen w-screen">
      <Canvas camera={{ position: [0, 0, 80], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} fade speed={2} />
        <GravitySimulation m1={mass1} m2={mass2} r={distance} type1={type1} type2={type2} />
        <OrbitControls />
      </Canvas>

      <div className="absolute top-4 left-4 bg-gray-900/80 text-lime-400 p-4 rounded-lg font-mono space-y-2 w-64">
        <div>
          <label className="block mb-1">Mass 1 (kg):</label>
          <input type="number" className="w-full px-2 py-1 bg-black border border-lime-400 rounded"
            value={mass1} onChange={(e) => setMass1(Number(e.target.value))} />
        </div>
        <div>
          <label className="block mb-1">Type 1:</label>
          <select className="w-full px-2 py-1 bg-black border border-lime-400 rounded"
            value={type1} onChange={(e) => setType1(e.target.value)}>
            <option value="solid">Solid</option>
            <option value="gas">Gas</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Mass 2 (kg):</label>
          <input type="number" className="w-full px-2 py-1 bg-black border border-lime-400 rounded"
            value={mass2} onChange={(e) => setMass2(Number(e.target.value))} />
        </div>
        <div>
          <label className="block mb-1">Type 2:</label>
          <select className="w-full px-2 py-1 bg-black border border-lime-400 rounded"
            value={type2} onChange={(e) => setType2(e.target.value)}>
            <option value="solid">Solid</option>
            <option value="gas">Gas</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Distance (m):</label>
          <input type="number" className="w-full px-2 py-1 bg-black border border-lime-400 rounded"
            value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
        </div>
      </div>
    </div>
  );
}

export default UniversalGravitation;
