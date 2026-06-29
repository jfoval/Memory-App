import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PanoramaViewer } from './PanoramaViewer';
import { NavHud } from './NavHud';

// Renders the photo-sphere palace. The render loop pauses when the tab/canvas is
// hidden; the camera sits at the centre and only rotates (no movement), so there
// is nothing to clip through and you can never get stuck.
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
        dpr={[1, 2]}
        frameloop={active ? 'always' : 'never'}
        camera={{ fov: 75, near: 0.1, far: 1100, position: [0, 0, 0] }}
        gl={{ powerPreference: 'high-performance', antialias: true }}
      >
        <Suspense fallback={null}>
          <PanoramaViewer />
        </Suspense>
      </Canvas>
      <NavHud />
    </div>
  );
}
