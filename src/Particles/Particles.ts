import * as THREE from "three";
import vertexShader from "./shaders/particles/vertex.glsl";
import fragmentShader from "./shaders/particles/fragment.glsl";

class Particles {
  scene: THREE.Scene;
  count: number;
  geometry: THREE.BufferGeometry | undefined;
  material: THREE.ShaderMaterial | undefined;
  points: THREE.Points | undefined;
  particleMaskTexture: HTMLImageElement | undefined;
  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.count = 200;

    const spriteTexture = new THREE.TextureLoader().load(
      "./assets/particleMask.png",
      () => {
        this.setGeometry();
        this.setMaterial(spriteTexture);
        this.setPoints();
      }
    );
    spriteTexture.colorSpace = THREE.SRGBColorSpace;
  }

  setGeometry() {
    this.geometry = new THREE.BufferGeometry();

    const positionArray = new Float32Array(this.count * 3);
    const progressArray = new Float32Array(this.count);
    const sizeArray = new Float32Array(this.count);
    const alphaArray = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      positionArray[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positionArray[i * 3 + 1] = 0;
      positionArray[i * 3 + 2] = (Math.random() - 0.5) * 10;

      progressArray[i] = Math.random();

      sizeArray[i] = Math.random();

      alphaArray[i] = Math.random();
    }

    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positionArray, 3)
    );
    this.geometry.setAttribute(
      "aProgress",
      new THREE.Float32BufferAttribute(progressArray, 1)
    );
    this.geometry.setAttribute(
      "aSize",
      new THREE.Float32BufferAttribute(sizeArray, 1)
    );
    this.geometry.setAttribute(
      "aAlpha",
      new THREE.Float32BufferAttribute(alphaArray, 1)
    );
  }

  setMaterial(spriteTexture: THREE.Texture) {
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 100 },
        uProgressSpeed: { value: 0.000015 },
        uPerlinFrequency: { value: 0.17 },
        uPerlinMultiplier: { value: 1 },
        uMask: { value: spriteTexture },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
  }

  setPoints() {
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.position.y = -5;
    this.scene.add(this.points);
  }

  update(time: { value: number }) {
    if (this.material) {
      this.material.uniforms.uTime.value = time.value;
    }
  }
}

export default Particles;
