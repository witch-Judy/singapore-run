import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Custom color grading + film grain shader
const ColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grainIntensity: { value: 0.08 },
    vignetteIntensity: { value: 0.4 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float grainIntensity;
    uniform float vignetteIntensity;
    varying vec2 vUv;

    // Simple hash for grain
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Color grading: push shadows toward blue/teal, highlights warm
      float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      vec3 shadowTint = vec3(0.05, 0.08, 0.15); // blue shadows
      vec3 highlightTint = vec3(0.12, 0.10, 0.06); // warm highlights
      color.rgb += mix(shadowTint, highlightTint, luminance) * 0.5;

      // Slight teal push in midtones
      color.rgb += vec3(-0.01, 0.02, 0.02) * (1.0 - abs(luminance - 0.5) * 2.0);

      // Film grain
      float grain = (hash(vUv * 500.0 + time * 100.0) - 0.5) * grainIntensity;
      color.rgb += grain;

      // Vignette
      vec2 center = vUv - 0.5;
      float vignette = 1.0 - dot(center, center) * vignetteIntensity * 2.0;
      color.rgb *= vignette;

      // Slight contrast boost
      color.rgb = (color.rgb - 0.5) * 1.1 + 0.5;

      gl_FragColor = color;
    }
  `,
};

export interface PostProcessing {
  composer: EffectComposer;
  colorGradePass: ShaderPass;
}

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): PostProcessing {
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);

  // Render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom - neon glow on road edges, landmarks, trails
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    0.6,   // strength
    0.4,   // radius
    0.85,  // threshold
  );
  composer.addPass(bloom);

  // Color grading + grain + vignette
  const colorGradePass = new ShaderPass(ColorGradeShader);
  composer.addPass(colorGradePass);

  // Handle resize
  window.addEventListener('resize', () => {
    const newSize = renderer.getSize(new THREE.Vector2());
    composer.setSize(newSize.x, newSize.y);
  });

  return { composer, colorGradePass };
}
