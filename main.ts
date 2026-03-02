import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  BoxGeometry,
  Mesh,
  MeshNormalMaterial,
  AmbientLight,
  MeshPhongMaterial,
  Color,
  Material,
  Raycaster,
  Vector2,
  Timer,
  Box3,
  Vector3,
  Group,
  CylinderGeometry,
  Object3D,
  MeshBasicMaterial,
  HemisphereLight,
  DirectionalLight,
  MeshToonMaterial,
  NearestFilter,
  DataTexture,
  RingGeometry,
  RGBAFormat,
} from 'three';


import {
  OrbitControls
} from 'three/addons/controls/OrbitControls.js';

import {
  GLTF,
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';


import { ARButton } from 'three/addons/webxr/ARButton.js';

let container: HTMLDivElement;

let camera: PerspectiveCamera;
let scene: Scene;
let renderer: WebGLRenderer;

let controller1: Group;
let controller2: Group;

let reticle: Mesh;
let pokModel: Object3D;
let hitTestSource: XRHitTestSource | null = null;
let hitTestSourceRequested = false;

let lstPokemon: string[] = [];

async function listPokemonLoad(): Promise<string[]> {
  const response = await fetch("assets/lst_pokemon.txt");
  const text = await response.text();

  const list = text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return list;
}

listPokemonLoad().then(list => {
  // console.log(list);
  lstPokemon = list;
});

init();

function init(): void {

  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new Scene();

  camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  const light = new HemisphereLight(0xffffff, 0xbbbbff, 3);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  renderer = new WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;

  container.appendChild(renderer.domElement);

  document.body.appendChild(
    ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test']
    })
  );

  const geometry = new CylinderGeometry(0.1, 0.1, 0.2, 32)
    .translate(0, 0.1, 0);

  function onSelect(): void {

    if (reticle.visible) {

      const material = new MeshPhongMaterial({
        color: 0xffffff * Math.random()
      });

      // const mesh = new Mesh(loadData(), material);

      const model = loadData()
      if (model) {

        reticle.matrix.decompose(
          model.position,
          model.quaternion,
          model.scale
        );

        scene.add(model);
      }
    }
  }

  controller1 = renderer.xr.getController(0);
  (controller1 as any).addEventListener('select', onSelect);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  (controller2 as any).addEventListener('select', onSelect);
  scene.add(controller2);

  reticle = new Mesh(
    new RingGeometry(0.15, 0.2, 32)
      .rotateX(-Math.PI / 2),
    new MeshBasicMaterial()
  );

  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  scene.add(reticle);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize(): void {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(
  timestamp: DOMHighResTimeStamp,
  frame?: XRFrame
): void {

  if (frame) {

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!session || !referenceSpace) return;

    if (hitTestSourceRequested === false) {

      session.requestReferenceSpace('viewer')
        .then((viewerSpace) => {

          if (viewerSpace) {
            session.requestHitTestSource?.({
              space: viewerSpace
            })?.then((source) => {
              hitTestSource = source;
            });
          }
        });

      session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });

      hitTestSourceRequested = true;
    }

    if (hitTestSource) {

      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {

        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        if (pose) {
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
        }

      } else {

        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}


function gltfReader(gltf: GLTF) {
  const model = convertGLTFModel(gltf, 1);
  model.traverse((obj) => {
    if ((obj as Mesh).isMesh) {
      const mesh = obj as Mesh;

      mesh.material = new MeshBasicMaterial({
        color: 0x000000
      });
      // mesh.material = originalMaterials.get(mesh)!;
    }
  });
  model.traverse((obj) => {
    obj.layers.set(1);
  })

  pokModel = model;

}

function loadData(): void | Object3D {
  const idPokemon: string = randomPokemon();
  if (!idPokemon) return;
  new GLTFLoader()
    .setPath('assets/Pokemon_models/' + idPokemon)
    .setResourcePath('assets/Pokemon_models/' + idPokemon + '/images/')
    .load('/' + idPokemon.toLowerCase() + '.glb', gltfReader);
  return pokModel;
}

function convertGLTFModel(gltf: GLTF, maxAllowedSize = 40): Object3D {

  const model = gltf.scene;

  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());

  const maxAxis = Math.max(size.x, size.y, size.z);

  if (maxAxis > maxAllowedSize) {
    const scale = maxAllowedSize / maxAxis;
    model.scale.setScalar(scale);
  }

  box.setFromObject(model);
  const newCenter = box.getCenter(new Vector3());

  model.position.sub(newCenter);

  box.setFromObject(model);
  model.position.y -= box.min.y;

  return model;
}

function randomPokemon(): string {

  const randomIndex = Math.floor(Math.random() * lstPokemon.length);
  return 'Abra';
}


