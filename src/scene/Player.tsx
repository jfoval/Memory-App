import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNav } from '../store/navStore';
import { getLocus } from '../palace/palaceData';
import { EYE_HEIGHT, resolveMove } from './collision';

const MOVE_SPEED = 9; // units per second
const LOOK_SENSITIVITY = 0.0024;
const TOUCH_LOOK_SENSITIVITY = 0.005;
const PITCH_LIMIT = Math.PI / 2 - 0.15;

// First-person controller. Desktop: WASD/arrows + pointer-lock mouse-look (with
// drag fallback). Touch: joystick + drag handled in the nav store. Guided walk
// glides the camera to a locus and faces it. Collision keeps the player inside
// the floor and outside every landmark.
export function Player() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const yaw = useRef(Math.PI);
  const pitch = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const dragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const pointerLocked = useRef(false);

  // Initialise camera at the first locus looking forward.
  useEffect(() => {
    const start = getLocus(1)!;
    camera.position.set(start.position.x, EYE_HEIGHT, start.position.z + 6);
    yaw.current = Math.PI;
    pitch.current = 0;
  }, [camera]);

  useEffect(() => {
    const dom = gl.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (useNav.getState().controlMode !== 'free') return;
      if (e.pointerType === 'mouse') {
        // Try pointer lock; fall back to drag-look if unavailable.
        if (dom.requestPointerLock) dom.requestPointerLock();
        dragging.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
      }
    };
    const onPointerUp = () => {
      dragging.current = false;
      lastPointer.current = null;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (useNav.getState().controlMode !== 'free') return;
      if (pointerLocked.current) {
        yaw.current -= e.movementX * LOOK_SENSITIVITY;
        pitch.current -= e.movementY * LOOK_SENSITIVITY;
      } else if (dragging.current && lastPointer.current && e.pointerType === 'mouse') {
        yaw.current -= (e.clientX - lastPointer.current.x) * LOOK_SENSITIVITY;
        pitch.current -= (e.clientY - lastPointer.current.y) * LOOK_SENSITIVITY;
        lastPointer.current = { x: e.clientX, y: e.clientY };
      }
      pitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current));
    };
    const onLockChange = () => {
      pointerLocked.current = document.pointerLockElement === dom;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerlockchange', onLockChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, [gl]);

  const tmp = useRef(new THREE.Vector3());

  useFrame((_, deltaRaw) => {
    const delta = Math.min(deltaRaw, 0.05);
    const nav = useNav.getState();

    // --- Guided glide ---
    if (nav.guidedTarget != null) {
      const locus = getLocus(nav.guidedTarget);
      if (locus) {
        // Stand a few units back from the locus, facing it.
        const back = new THREE.Vector3(0, 0, 6);
        const target = new THREE.Vector3(
          locus.position.x + back.x,
          EYE_HEIGHT,
          locus.position.z + back.z,
        );
        const instant = nav.reducedMotion;
        if (instant) camera.position.copy(target);
        else camera.position.lerp(target, Math.min(1, delta * 4));

        // Face the locus.
        tmp.current.set(locus.position.x, EYE_HEIGHT, locus.position.z);
        const dir = tmp.current.clone().sub(camera.position);
        const desiredYaw = Math.atan2(dir.x, dir.z) + Math.PI;
        const desiredPitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
        yaw.current = instant ? desiredYaw : lerpAngle(yaw.current, desiredYaw, delta * 5);
        pitch.current += (desiredPitch - pitch.current) * (instant ? 1 : delta * 5);

        if (camera.position.distanceTo(target) < 0.15 || instant) {
          camera.position.copy(target);
          nav.clearGuidedTarget(nav.guidedTarget);
        }
      }
      applyRotation(camera, yaw.current, pitch.current);
      return;
    }

    // --- Free-roam look (touch) ---
    if (nav.controlMode === 'free') {
      const look = nav.consumeLook();
      yaw.current -= look.dx * TOUCH_LOOK_SENSITIVITY;
      pitch.current -= look.dy * TOUCH_LOOK_SENSITIVITY;
      pitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current));

      // --- Movement ---
      let forward = 0;
      let strafe = 0;
      const k = keys.current;
      if (k['KeyW'] || k['ArrowUp']) forward += 1;
      if (k['KeyS'] || k['ArrowDown']) forward -= 1;
      if (k['KeyA'] || k['ArrowLeft']) strafe -= 1;
      if (k['KeyD'] || k['ArrowRight']) strafe += 1;
      forward += nav.touch.moveY;
      strafe += nav.touch.moveX;

      if (forward !== 0 || strafe !== 0) {
        const sin = Math.sin(yaw.current);
        const cos = Math.cos(yaw.current);
        // Forward is -z rotated by yaw.
        const dx = -sin * forward + cos * strafe;
        const dz = -cos * forward - sin * strafe;
        const len = Math.hypot(dx, dz) || 1;
        const step = MOVE_SPEED * delta;
        const desired = {
          x: camera.position.x + (dx / len) * step,
          z: camera.position.z + (dz / len) * step,
        };
        const resolved = resolveMove(desired);
        camera.position.x = resolved.x;
        camera.position.z = resolved.z;
        camera.position.y = EYE_HEIGHT;
      }
    }

    applyRotation(camera, yaw.current, pitch.current);
  });

  return null;
}

function applyRotation(camera: THREE.Camera, yaw: number, pitch: number) {
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  camera.rotation.z = 0;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(1, t);
}
