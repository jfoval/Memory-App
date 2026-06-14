import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Base URL so models resolve under both root and GitHub Pages (/Memory-App/).
const BASE = import.meta.env.BASE_URL;
const modelUrl = (slug: string) => `${BASE}models/${slug}.glb`;

// Loads a GLB and auto-normalises it: scaled so its largest dimension is
// `target` metres and shifted so it sits on the floor and is centred. This lets
// any model from any kit drop in at a consistent, sensible size.
function GLTFModel({ slug, target }: { slug: string; target: number }) {
  const { scene } = useGLTF(modelUrl(slug));
  const object = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = target / maxDim;
    const group = new THREE.Group();
    clone.position.set(-center.x, -box.min.y, -center.z); // centre + sit on floor
    group.add(clone);
    group.scale.setScalar(scale);
    return group;
  }, [scene, target]);

  return <primitive object={object} />;
}

// 3D-safe error boundary: if a model fails to load/parse, render a fallback so
// the whole scene never crashes.
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Model({
  slug,
  target = 2.6,
  fallback,
}: {
  slug: string;
  target?: number;
  fallback: ReactNode;
}) {
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GLTFModel slug={slug} target={target} />
      </Suspense>
    </ModelBoundary>
  );
}
