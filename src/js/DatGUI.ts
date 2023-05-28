import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

class DatGUI {
  constructor(renderer: THREE.WebGLRenderer, selectiveBloom: any) {
    let gui = new GUI();
    gui.hide();
    const folder = gui.addFolder("Bloom Parameters");

    folder
      .add(selectiveBloom.params, "exposure", 0.1, 2)
      .onChange(function (value: number) {
        renderer.toneMappingExposure = Math.pow(value, 4.0);
      });

    folder
      .add(selectiveBloom.params, "bloomThreshold", 0.0, 1.0)
      .onChange(function (value: number) {
        selectiveBloom.bloomPass.threshold = Number(value);
      });

    folder
      .add(selectiveBloom.params, "bloomStrength", 0.0, 10.0)
      .onChange(function (value: number) {
        selectiveBloom.bloomPass.strength = Number(value);
      });

    folder
      .add(selectiveBloom.params, "bloomRadius", 0.0, 1.0)
      .step(0.01)
      .onChange(function (value: number) {
        selectiveBloom.bloomPass.radius = Number(value);
      });
  }
}

export { DatGUI };
