import * as THREE from 'three';
import { BG_COLOR } from '../config';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export function createScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_COLOR);
  scene.fog = new THREE.FogExp2(BG_COLOR, 0.006);

  const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.3,
    3000,
  );
  camera.position.set(0, 80, 80);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Lighting — brighter ambient for night city feel
  const ambient = new THREE.AmbientLight(0x334466, 1.2);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x6688bb, 0.6);
  dirLight.position.set(50, 100, 50);
  scene.add(dirLight);

  // Hemisphere light — warm from below (city light bounce), cool from above (night sky)
  const hemiLight = new THREE.HemisphereLight(0x112244, 0x221100, 0.8);
  scene.add(hemiLight);

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(6000, 6000);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x0a0a1e });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
