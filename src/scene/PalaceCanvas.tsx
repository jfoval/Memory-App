import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PalaceScene } from './PalaceScene';
import { TouchControls } from './TouchControls';
import { NavHud } from './NavHud';

// Wraps the R3F canvas with the mobile performance budget: pixel ratio clamped
// to 2, frustum culling on by default, shadows kept cheap, and the render loop
// paused whenever the tab/canvas is hidden.
export function PalaceCanvas() {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const onVis = () => setActive(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <div className="palace-canvas absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        frameloop={active ? 'always' : 'never'}
        camera={{ fov: 70, near: 0.1, far: 200 }}
        gl={{ powerPreference: 'high-performance', antialias: true }}
      >
        <PalaceScene />
      </Canvas>
      <NavHud />
      <TouchControls />
    </div>
  );
}
