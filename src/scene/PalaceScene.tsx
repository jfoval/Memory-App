import { useMemo } from 'react';
import { Sky } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { PALACE } from '../palace/palaceData';
import { ZONE_IDS, ZONES, ZONE_SIZE } from '../palace/zones';
import { LocusObject } from './LocusObject';
import { Player } from './Player';
import { useNav } from '../store/navStore';

// Each zone is a three-sided room (two outer walls + raised, tinted floor) that
// opens onto a shared central plaza, so the palace reads as four connected
// rooms you walk between rather than objects floating in a void.
function Rooms() {
  return (
    <group>
      {/* Shared plaza floor under everything. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#1a2233" roughness={1} />
      </mesh>

      {ZONE_IDS.map((id) => {
        const z = ZONES[id];
        const S = ZONE_SIZE;
        const ox = z.origin.x;
        const oz = z.origin.z;
        const cx = ox + S / 2;
        const cz = oz + S / 2;
        // Outer edges are the ones farther from the centre of the map.
        const outerX = Math.abs(ox) > Math.abs(ox + S) ? ox : ox + S;
        const outerZ = Math.abs(oz) > Math.abs(oz + S) ? oz : oz + S;
        const H = 5;
        return (
          <group key={id}>
            {/* Raised, tinted room floor. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.04, cz]} receiveShadow>
              <planeGeometry args={[S, S]} />
              <meshStandardMaterial color={z.tint} transparent opacity={0.18} roughness={1} />
            </mesh>
            {/* Floor border trim. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.05, cz]}>
              <ringGeometry args={[S / 2 - 0.6, S / 2, 4, 1]} />
              <meshStandardMaterial color={z.tint} opacity={0.5} transparent />
            </mesh>
            {/* Two outer walls. */}
            <mesh position={[outerX, H / 2, cz]} castShadow receiveShadow>
              <boxGeometry args={[0.8, H, S]} />
              <meshStandardMaterial color="#243047" roughness={0.9} />
            </mesh>
            <mesh position={[cx, H / 2, outerZ]} castShadow receiveShadow>
              <boxGeometry args={[S, H, 0.8]} />
              <meshStandardMaterial color="#243047" roughness={0.9} />
            </mesh>
            {/* Corner pillar where the two walls meet. */}
            <mesh position={[outerX, H / 2 + 0.6, outerZ]} castShadow>
              <boxGeometry args={[1.4, H + 1.2, 1.4]} />
              <meshStandardMaterial color={z.tint} roughness={0.7} />
            </mesh>
          </group>
        );
      })}
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
      <fog attach="fog" args={['#aab9d4', 60, 150]} />
      <Sky sunPosition={[40, 30, 20]} turbidity={6} rayleigh={1.2} mieCoefficient={0.01} />

      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#cfe0ff', '#26211a', 0.6]} />
      <directionalLight
        position={[40, 50, 20]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-far={200}
      />
      {/* Warm fill over the crypt so it feels torch-lit. */}
      <pointLight position={[ZONES[3].origin.x + 18, 8, ZONES[3].origin.z + 18]} intensity={40} color="#ff8a3d" distance={45} />

      <Rooms />

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

      <EffectComposer>
        <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.3} intensity={0.4} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.6} />
      </EffectComposer>
    </>
  );
}
