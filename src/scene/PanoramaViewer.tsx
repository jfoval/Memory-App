import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getLocus, lociInRoom } from '../palace/palaceData';
import { roomById } from '../palace/rooms';
import { useNav } from '../store/navStore';
import { useWorld } from '../store/worldStore';
import { makeLabelTexture, makePanelTexture } from './labels';

const BASE = import.meta.env.BASE_URL;
const R = 120; // marker radius (inside the photo sphere)
const LOOK = 0.0025;
const PITCH_LIMIT = 1.4;

// Direction → 3D point, matching a YXZ camera (rotation.y = yaw, rotation.x =
// pitch) so "facing" a locus and placing its marker stay perfectly aligned.
function dir(yaw: number, pitch: number, radius: number): [number, number, number] {
  const cp = Math.cos(pitch);
  return [-radius * cp * Math.sin(yaw), radius * Math.sin(pitch), -radius * cp * Math.cos(yaw)];
}

function Hotspot({ index }: { index: number }) {
  const locus = getLocus(index)!;
  const labelsVisible = useNav((s) => s.labelsVisible);
  const selected = useNav((s) => s.selectedIndex === index);
  const goto = useNav((s) => s.gotoLocus);
  const placed = useWorld((s) => s.placed[index]);
  const hidden = useWorld((s) => s.hidden);

  const labelTex = useMemo(
    () => makeLabelTexture(String(index), roomById(locus.roomId).accent),
    [index, locus.roomId],
  );
  const panelTex = useMemo(() => {
    if (!placed) return null;
    return makePanelTexture(
      hidden ? '· · ·' : placed.title,
      hidden ? undefined : placed.subtitle,
      placed.accent ?? roomById(locus.roomId).accent,
    );
  }, [placed, hidden, locus.roomId]);

  const pos = dir(locus.yaw, locus.pitch, R);

  return (
    <Billboard position={pos}>
      {/* number marker */}
      <mesh
        scale={selected ? 11 : 9}
        onClick={(e) => {
          e.stopPropagation();
          goto(index);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
        visible={labelsVisible || !!placed}
      >
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color={selected ? '#ffffff' : roomById(locus.roomId).accent} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      {labelsVisible && (
        <mesh scale={selected ? 11 : 9} position={[0, 0, 0.1]}>
          <planeGeometry args={[1.2, 0.6]} />
          <meshBasicMaterial map={labelTex} transparent toneMapped={false} />
        </mesh>
      )}
      {panelTex && (
        <mesh position={[0, 16, 0]} scale={14}>
          <planeGeometry args={[2, 1]} />
          <meshBasicMaterial map={panelTex} transparent toneMapped={false} />
        </mesh>
      )}
    </Billboard>
  );
}

export function PanoramaViewer() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const arrivedIndex = useNav((s) => s.arrivedIndex);
  const guidedTarget = useNav((s) => s.guidedTarget);
  const reducedMotion = useNav((s) => s.reducedMotion);
  const arrive = useNav((s) => s.arrive);

  // The displayed room follows the guided target (so we can fly to another room)
  // and otherwise the room we last arrived in.
  const focusIndex = guidedTarget ?? arrivedIndex;
  const room = roomById(getLocus(focusIndex)!.roomId);
  const texture = useTexture(`${BASE}panoramas/${room.image}.jpg`);
  texture.colorSpace = THREE.SRGBColorSpace;

  const loci = useMemo(() => lociInRoom(room.id), [room.id]);

  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const dom = gl.domElement;
    const down = (e: PointerEvent) => {
      if (useNav.getState().guidedTarget != null) return;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      dragging.current = false;
      last.current = null;
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current || !last.current) return;
      yaw.current -= (e.clientX - last.current.x) * LOOK;
      pitch.current += (e.clientY - last.current.y) * LOOK;
      pitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current));
      last.current = { x: e.clientX, y: e.clientY };
    };
    dom.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointermove', move);
    return () => {
      dom.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointermove', move);
    };
  }, [gl]);

  useFrame((_, deltaRaw) => {
    const delta = Math.min(deltaRaw, 0.05);
    const target = useNav.getState().guidedTarget;
    if (target != null) {
      const locus = getLocus(target)!;
      const t = reducedMotion ? 1 : Math.min(1, delta * 4);
      // shortest-path yaw
      let dy = locus.yaw - yaw.current;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      yaw.current += dy * t;
      pitch.current += (locus.pitch - pitch.current) * t;
      if (reducedMotion || Math.abs(dy) < 0.01) {
        yaw.current = locus.yaw;
        pitch.current = locus.pitch;
        arrive(target);
      }
    }
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    camera.rotation.z = 0;
  });

  return (
    <>
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      {loci.map((l) => (
        <Hotspot key={l.index} index={l.index} />
      ))}
    </>
  );
}
