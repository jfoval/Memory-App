import { useMemo } from 'react';
import { Billboard } from '@react-three/drei';
import type { Locus } from '../types';
import { ZONES } from '../palace/zones';
import { makeLabelTexture, makePanelTexture } from './labels';
import { Model } from './Model';
import { useWorld } from '../store/worldStore';

interface Props {
  locus: Locus;
  selected: boolean;
  showLabel: boolean;
  onSelect: (index: number) => void;
}

// A real model standing at the locus, with its index label and — when content
// has been "loaded into the world" — a floating panel showing what you placed
// there, so you learn the content together with the location.
export function LocusObject({ locus, selected, showLabel, onSelect }: Props) {
  const labelTex = useMemo(
    () => makeLabelTexture(String(locus.index), ZONES[locus.zone].tint),
    [locus.index, locus.zone],
  );
  const placed = useWorld((s) => s.placed[locus.index]);
  const hidden = useWorld((s) => s.hidden);

  const panelTex = useMemo(() => {
    if (!placed) return null;
    const title = hidden ? '· · ·' : placed.title;
    return makePanelTexture(title, hidden ? undefined : placed.subtitle, placed.accent ?? '#38bdf8');
  }, [placed, hidden]);

  const fallback = (
    <mesh position={[0, 1.1, 0]} castShadow>
      <boxGeometry args={[1.6, 2.2, 1.6]} />
      <meshStandardMaterial color={locus.color} />
    </mesh>
  );

  return (
    <group position={[locus.position.x, 0, locus.position.z]}>
      {/* Clickable hit area + the real model. */}
      <group
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
        <Model slug={locus.model} fallback={fallback} />
        {/* Invisible click target so small props are still easy to tap. */}
        <mesh position={[0, 1.3, 0]} visible={false}>
          <boxGeometry args={[2.6, 2.6, 2.6]} />
        </mesh>
      </group>

      {/* Marker disc + selection ring on the floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <circleGeometry args={[1.7, 32]} />
        <meshStandardMaterial
          color={selected ? '#ffffff' : ZONES[locus.zone].tint}
          transparent
          opacity={selected ? 0.5 : 0.22}
        />
      </mesh>

      {showLabel && (
        <Billboard position={[0, 3.2, 0]}>
          <mesh scale={selected ? 1.3 : 1}>
            <planeGeometry args={[1.4, 0.7]} />
            <meshBasicMaterial map={labelTex} transparent toneMapped={false} />
          </mesh>
        </Billboard>
      )}

      {panelTex && (
        <Billboard position={[0, 4.6, 0]}>
          <mesh>
            <planeGeometry args={[3, 1.5]} />
            <meshBasicMaterial map={panelTex} transparent toneMapped={false} />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}
