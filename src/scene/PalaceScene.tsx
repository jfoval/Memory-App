import { useMemo } from 'react';
import { PALACE } from '../palace/palaceData';
import { ZONE_IDS, ZONES, ZONE_SIZE } from '../palace/zones';
import { LocusObject } from './LocusObject';
import { Player } from './Player';
import { useNav } from '../store/navStore';

// Zone floor tiles, perimeter walls, lighting, the 52 loci, and the player.
function Ground() {
  return (
    <group>
      {/* Base floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0b1220" roughness={1} />
      </mesh>

      {/* Subtly tinted zone tiles to reinforce the four sections. */}
      {ZONE_IDS.map((id) => {
        const z = ZONES[id];
        return (
          <mesh
            key={id}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[z.origin.x + ZONE_SIZE / 2, 0.02, z.origin.z + ZONE_SIZE / 2]}
            receiveShadow
          >
            <planeGeometry args={[ZONE_SIZE, ZONE_SIZE]} />
            <meshStandardMaterial color={z.tint} transparent opacity={0.12} roughness={1} />
          </mesh>
        );
      })}

      {/* Perimeter walls. */}
      {(
        [
          [0, -49, 100, 2],
          [0, 49, 100, 2],
          [-49, 0, 2, 100],
          [49, 0, 2, 100],
        ] as const
      ).map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 2, z]}>
          <boxGeometry args={[w, 4, d]} />
          <meshStandardMaterial color="#1e293b" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

export function PalaceScene() {
  const selectedIndex = useNav((s) => s.selectedIndex);
  const labelsVisible = useNav((s) => s.labelsVisible);
  const select = useNav((s) => s.gotoLocus);
  const loci = useMemo(() => PALACE, []);

  return (
    <>
      <color attach="background" args={['#070b14']} />
      <fog attach="fog" args={['#070b14', 40, 120]} />
      <hemisphereLight args={['#bcd0ff', '#0a0f1c', 0.7]} />
      <directionalLight
        position={[30, 40, 20]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Ground />

      {loci.map((locus) => (
        <LocusObject
          key={locus.index}
          locus={locus}
          selected={selectedIndex === locus.index}
          showLabel={labelsVisible}
          onSelect={select}
        />
      ))}

      <Player />
    </>
  );
}
