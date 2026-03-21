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
  Quaternion,
  NearestFilter,
  DataTexture,
  RingGeometry,
  RGBAFormat,
  SphereGeometry,
  ConeGeometry,
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
import { PI } from 'three/tsl';

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

let raycaster = new Raycaster();
let INTERSECTED: any;
let pointer = new Vector2(0, 0);

let sameTimeNumberPokemon = 8
const targets: Object3D[] = [];
let listModelPokemon: Object3D[] = [];

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

  async function onSelect(): Promise<void> {

    if (!reticle.visible) return;

    const basePosition = new Vector3();
    const baseQuaternion = new Quaternion();
    const baseScale = new Vector3();

    reticle.matrix.decompose(basePosition, baseQuaternion, baseScale);

    for (let i = 0; i < targets.length; i++) {

      const model = await loadData();
      if (!model) return;
      const offset = targets[i].position.clone();
      offset.applyQuaternion(baseQuaternion);

      model.position.copy(basePosition);
      let camera_position: Vector3 = new Vector3();
      camera.getWorldPosition(camera_position);
      model.lookAt(camera_position)

      scene.add(model);
    }
  }

  controller1 = renderer.xr.getController(0);
  (controller1 as any).addEventListener('select', spawnPokemonAuto);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  (controller2 as any).addEventListener('select', spawnPokemonAuto);
  scene.add(controller2);

  reticle = new Mesh(
    new RingGeometry(0.15, 0.2, 32)
      .rotateX(-Math.PI / 2),
    new MeshBasicMaterial()
  );

  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  scene.add(reticle);
  spawnPokemonAuto();
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

    // intersection detection
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(targets, false);

    if (intersects.length > 0) {
      if (INTERSECTED != intersects[0].object) {

        if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        INTERSECTED = intersects[0].object;
        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        INTERSECTED.material.emissive.setHex(0xff0000);
      }

    } else {

      if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
      INTERSECTED = null;

    }

    renderer.render(scene, camera);

  }

  renderer.render(scene, camera);
}


function gltfReader(gltf: GLTF) {
  const model = convertGLTFModel(gltf, 1);
  model.traverse((obj) => {
    if ((obj as Mesh).isMesh) {
      const mesh = obj as Mesh;


      // mesh.material = originalMaterials.get(mesh)!;
    }
  });
  model.traverse((obj) => {
    obj.layers.set(1);
  })

  pokModel = model;

}

async function loadData(): Promise<Object3D> {
  const idPokemon: string = randomPokemon();
  if (!idPokemon) {
    console.log("fail");
    return new Object3D();
  }
  return new Promise((resolve) => {
    new GLTFLoader()
      .setPath('assets/Pokemon_models/' + idPokemon)
      .setResourcePath('assets/Pokemon_models/' + idPokemon + '/images/')
      .load('/' + idPokemon.toLowerCase() + '.glb', (gltf) => {
        gltfReader(gltf);
        resolve(pokModel);
      });
  });
}

function convertGLTFModel(gltf: GLTF, maxAllowedSize = 0.50): Object3D {

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
  return lstPokemon[randomIndex];
}


async function spawnPokemonAuto() {
  console.log("rentré");
  const nb_pokemon = sameTimeNumberPokemon; // nombre de pokemons
  const radius = 1.5;                  // rayon de la sphère
  const targets: Object3D[] = [];
  const vector = new Vector3();

  let camera_position: Vector3 = new Vector3();
  camera.getWorldPosition(camera_position);

  for (let i = 0; i < nb_pokemon; i++) {
    const phi = Math.acos(-1 + (2 * i) / nb_pokemon);
    const theta = Math.sqrt(nb_pokemon * Math.PI) * phi;
    const object = new Object3D();
    object.position.setFromSphericalCoords(radius, phi, theta);
    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(camera_position);
    targets.push(object);
  }

  // console.log(targets);

  for (let j = 0; j < targets.length; j++) {
    console.log("model" + j);


    const model = await loadData()
    if (model) {
      model.position.copy(targets[j].position);
      // console.log(targets[j].position);

      model.lookAt(camera_position);
      scene.add(model);
      listModelPokemon.push(model)
    }
  }
  console.log(listModelPokemon)


}

function try_onClick(event: MouseEvent) {
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(listModelPokemon, true);
}