import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ThreeEarthSceneProps {
  className?: string;
}

/**
 * Centered Three.js 3D Earth Component
 * Fixed-size globe in center rotating slowly (rotation.y += 0.003).
 * Strictly NO camera zoom into secret coordinates to prevent spoiling the location.
 */
export const ThreeEarthScene: React.FC<ThreeEarthSceneProps> = ({
  className = 'w-full h-full',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.enableZoom = false; // Fixed distance to keep globe perfectly centered
    controls.minDistance = 6.2;
    controls.maxDistance = 6.2;

    // 3. Textures (High-Res Blue Marble + Bump Map with procedural fallback)
    const textureLoader = new THREE.TextureLoader();

    const createFallbackTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#090D16';
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(200, 100, 40, 0, Math.PI * 2);
        ctx.arc(350, 140, 60, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const earthTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      undefined,
      undefined,
      () => createFallbackTexture()
    );

    const bumpTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-topology.png'
    );

    // 4. Earth Sphere Mesh
    const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.06,
      roughness: 0.7,
      metalness: 0.1,
    });

    const earthMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(earthMesh);

    // Subtle atmospheric glow ring
    const atmosphereGeometry = new THREE.SphereGeometry(2.06, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // 5. Lighting: Angled Sun Directional Light + Ambient Light
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(6, 3, 5);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x222222, 0.9);
    scene.add(ambientLight);

    const blueFill = new THREE.DirectionalLight(0x38bdf8, 0.5);
    blueFill.position.set(-6, -2, -4);
    scene.add(blueFill);

    // 6. Animation Loop: Smooth Gentle Rotation
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      earthMesh.rotation.y += 0.003;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Container Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      earthTexture.dispose();
      bumpTexture.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={className} />;
};

export default ThreeEarthScene;
