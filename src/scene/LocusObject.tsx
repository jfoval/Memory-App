import { useMemo } from 'react';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Locus, LocusShape } from '../types';
import { ZONES } from '../palace/zones';
import { makeLabelTexture } from './labels';

// Geometry is chosen by shape behind this single component, so richer authored
// models can replace the primitives later without touching app logic.
function geometryFor(shape: LocusShape): THREE.BufferGeometry {
  switch (shape) {
    case 'cube':
      return new THREE.BoxGeometry(2, 2, 2);
    case 'sphere':
      return new THREE.SphereGeometry(1.3, 24, 16);
    case 'cylinder':
      return new THREE.CylinderGeometry(1.1, 1.1, 2.4, 24);
    case 'cone':
      return new THREE.ConeGeometry(1.3, 2.6, 24);
    case 'torus':
      return new THREE.TorusGeometry(1.1, 0.4, 16, 32);
    case 'pyramid':
      return new THREE.ConeGeometry(1.5, 2.4, 4);
    case 'arch':
      return new THREE.TorusGeometry(1.3, 0.35, 12, 24, Math.PI);
    case 'ring':
      return new THREE.TorusGeometry(1.3, 0.25, 12, 32);
  }
}

interface Props {
  locus: Locus;
  selected: boolean;
  showLabel: boolean;
  onSelect: (index: number) => void;
}

export function LocusObject({ locus, selected, showLabel, onSelect }: Props) {
  const geometry = useMemo(() => geometryFor(locus.shape), [locus.shape]);
  const labelTex = useMemo(
    () => makeLabelTexture(String(locus.index), ZONES[locus.zone].tint),
    [locus.index, locus.zone],
  );
  const yOffset = locus.shape === 'torus' || locus.shape === 'ring' ? 1.2 : 1.3;

  return (
    <group position={[locus.position.x, 0, locus.position.z]}>
      <mesh
        geometry={geometry}
        position={[0, yOffset, 0]}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(locus.index);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={locus.color}
          emissive={selected ? '#ffffff' : '#000000'}
          emissiveIntensity={selected ? 0.35 : 0}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Pedestal so every landmark sits clearly on the floor. */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[1.7, 1.9, 0.2, 24]} />
        <meshStandardMaterial color={ZONES[locus.zone].tint} roughness={0.9} />
      </mesh>

      {showLabel && (
        <Billboard position={[0, 3.4, 0]}>
          <mesh scale={selected ? 1.4 : 1}>
            <planeGeometry args={[1.6, 0.8]} />
            <meshBasicMaterial map={labelTex} transparent toneMapped={false} />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}
