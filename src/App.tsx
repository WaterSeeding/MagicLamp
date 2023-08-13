import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SelectiveBloom } from "./js/SelectiveBloom";
import Particles from "./Particles/Particles";
import Time from "./Time";
import "./App.css";

const getCubeMapTexture = (renderer: THREE.WebGLRenderer, path: string) => {
  return new Promise((resolve, reject) => {
    new RGBELoader().load(
      path,
      (texture) => {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        pmremGenerator.dispose();
        resolve(envMap);
      },
      undefined,
      reject
    );
  });
};

export default function App() {
  let isInitScene = false;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlay, setIsAudioPlay] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitScene) {
      isInitScene = true;
      initScene();
    }
  }, [isInitScene]);

  const initScene = async () => {
    const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector("canvas.webgl")!,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0.0);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      200
    );
    camera.position.set(0, 4, 20);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = false;

    let envMap = (await getCubeMapTexture(
      renderer,
      "./hdr/satara_night_4k.hdr"
    )) as THREE.Texture;

    let light = new THREE.DirectionalLight();
    light.position.setScalar(1);
    scene.add(light, new THREE.AmbientLight(0xffffff, 1.0));

    let { world }: any = await addWorld(scene);
    let { models, mixer }: any = await addModel(scene);
    let { ring, ringMixer }: any = await addRing(scene);

    let particles = new Particles(scene);

    let selectiveBloom = new SelectiveBloom(scene, camera, renderer);

    let time = new Time();
    let clock = new THREE.Clock();
    window.addEventListener("resize", onResize);
    renderer.setAnimationLoop(() => {
      let delta = clock.getDelta();

      time.tick();

      particles.update({
        value: time.value(),
      });

      const shader = ring.material.userData.shader;

      if (shader) {
        shader.uniforms["uTime"].value = time.value() * 0.0005;
      }

      if (mixer) mixer.update(delta);
      if (ringMixer) ringMixer.update(delta);

      if (models) {
        world.material.color.set(0x000000);
        models.forEach((model: THREE.Mesh) => {
          // @ts-ignore;
          model.material.color.set(0x000000);
        });
        ring.material.color.set(0x000000);
        scene.background = null;
        scene.environment = null;
        renderer.toneMappingExposure = 1.02;
      }
      renderer.setClearColor(0x000000);
      selectiveBloom.bloomComposer.render();
      if (models) {
        world.material.color.copy(world.userData.color);
        models.forEach((model: THREE.Mesh) => {
          // @ts-ignore;
          model.material.color.copy(model.userData.color);
        });
        ring.material.color.copy(ring.userData.color);
      }
      if (envMap) {
        scene.background = envMap;
        scene.environment = envMap;
        renderer.toneMappingExposure = 1.0;
      }
      renderer.setClearColor(0x1d1d1d);
      selectiveBloom.finalComposer.render();

      // renderer.render(scene, camera);
      controls.update();
    });

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      selectiveBloom.bloomComposer.setSize(
        window.innerWidth,
        window.innerHeight
      );
      selectiveBloom.finalComposer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }
  };

  const addModel = (scene: THREE.Scene) => {
    return new Promise((resolve, reject) => {
      let models: THREE.Object3D[] | any[] = [];
      let mixer: THREE.AnimationAction | any;
      let loader = new GLTFLoader();
      loader.load("./lamp/scene.gltf", (gltf) => {
        let modelGroup = gltf.scene;
        modelGroup.traverse((object3D) => {
          if (object3D.type === "Mesh") {
            let mesh = object3D as THREE.Mesh;
            let material = mesh.material as THREE.MeshStandardMaterial;
            if (mesh.name === "Energy_aura_1_Mat_staff_Translucent_0") {
              material.emissiveIntensity = 0.2;
              material.metalness = 1.0;
              mesh.visible = true;
            } else if (mesh.name === "Energy_aura_2_Mat_staff_Translucent_0") {
              mesh.visible = true;
            } else if (mesh.name === "Energy_core_Mat_Staff_0") {
              mesh.visible = true;
            } else if (mesh.name === "Staff_Body_Mat_Staff_0") {
              mesh.visible = true;
              mesh.userData = {
                // @ts-ignore;
                color: new THREE.Color().copy(mesh.material.color),
              };
              models.push(mesh);
            } else {
              mesh.visible = true;
              material.emissiveIntensity = 1.0;
              material.metalness = 0.1;
              // mesh.userData = {
              //   // @ts-ignore;
              //   color: new THREE.Color().copy(mesh.material.color),
              // };
              // models.push(mesh);
            }
          }
        });

        mixer = new THREE.AnimationMixer(gltf.scene);
        mixer.clipAction(gltf.animations[0]).play();

        modelGroup.scale.set(1.4, 1.4, 1.4);
        modelGroup.rotateY(Math.PI / 2);
        modelGroup.position.setY(-0.5);
        scene.add(modelGroup);

        resolve({
          models,
          mixer,
        });
      });
    });
  };

  const addWorld = (scene: THREE.Scene) => {
    return new Promise((resolve, reject) => {
      let geometry = new THREE.SphereGeometry(15, 64, 32);
      geometry.scale(-1, 1, 1);

      let material = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load("./hdr/1.jpg"),
        depthTest: false,
      });

      let world = new THREE.Mesh(geometry, material);

      world!.userData = {
        // @ts-ignore;
        color: new THREE.Color().copy(world.material.color),
      };
      scene.add(world);
      resolve({
        world,
      });
    });
  };

  const addRing = (scene: THREE.Scene) => {
    return new Promise((resolve, reject) => {
      const textureloader = new THREE.TextureLoader();

      textureloader.load(
        "./ring/textures/Material.001_diffuse.png",
        function (texture) {
          textureloader.load(
            "./ring/textures/Material.001_emissive.png",
            function (emissiveTexture) {
              let ring: THREE.Object3D | any;
              let ringMixer: THREE.AnimationAction | any;
              let loader = new GLTFLoader();
              loader.load("./ring/scene.gltf", (gltf) => {
                let ringGroup = gltf.scene;
                ring = ringGroup.getObjectByName("Circle_0") as THREE.Object3D;
                ring.material.map = texture;
                ring.material.emissiveMap = emissiveTexture;
                ring.material.metalness = 0.1;
                ring.material.roughness = 0.1;
                ring.material.opacity = 1.0;
                // @ts-ignore;
                ring.material.onBeforeCompile = (shader) => {
                  shader.uniforms.uTime = { value: Math.PI / 2 };
                  shader.fragmentShader = `
                      uniform float uTime;
                      ${shader.fragmentShader}
                    `.replace(
                    `#include <premultiplied_alpha_fragment>`,
                    `#include <premultiplied_alpha_fragment>
                      gl_FragColor = vec4(gl_FragColor.r - 0.01 * abs(sin(uTime)), gl_FragColor.g, 0.1, gl_FragColor.a);
                    `
                  );
                  ring.material.userData.shader = shader;
                };
                ring.material.needsUpdate = true;

                ring.userData = {
                  // @ts-ignore;
                  color: new THREE.Color().copy(ring.material.color),
                };

                ringMixer = new THREE.AnimationMixer(ringGroup);
                ringMixer.clipAction(gltf.animations[0]).play();

                ringGroup.scale.set(0.6, 0.6, 0.6);
                ringGroup.position.setY(-1.0);

                scene.add(ringGroup);

                resolve({ ring, ringMixer });
              });
            }
          );
        }
      );
    });
  };

  const setAudioPlay = (value: boolean) => {
    let audioPlayer = audioRef.current as HTMLAudioElement;
    if (value) {
      audioPlayer.play();
    } else {
      audioPlayer.pause();
    }
    setIsAudioPlay(value);
  };

  return (
    <div className="App">
      <div className="content">
        <a
          className="title"
          href="https://github.com/WaterSeeding/MagicAgg"
          target="_blank"
        >
          Made in Three.js!
        </a>
      </div>
      <div
        className={`audioIcon ${isAudioPlay && "active"}`}
        onClick={() => setAudioPlay(!isAudioPlay)}
      ></div>
      <canvas
        className="webgl"
        style={{ width: "100%", height: "100%" }}
      ></canvas>
    </div>
  );
}
