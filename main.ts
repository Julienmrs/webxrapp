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
let pokemonAchercher: String = ""

let raycaster = new Raycaster();
// let INTERSECTED: any;
let pointer = new Vector2(0, 0);

let sameTimeNumberPokemon = 5;
let targets: Object3D[] = [];
let listModelPokemon: Object3D[] = [];
let listModelPokemonNames: String[] = [];

let textMesh: Mesh | null = null;
let font: Font;
const loader = new TTFLoader();
let currentText = "";

let score = 0;
let lives = 3;
let gameOver = false;

function fontLoad() {
  loader.load('assets/fonts/kenpixel.ttf', function (json) {
    font = new Font(json);
    createText(" Appuyez pour faire apparaitre les pokemons !");
  });
}
fontLoad();


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

  scene.add(camera);

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


  // async function onSelect(): Promise<void> {

  //   if (!reticle.visible) return;

  //   const basePosition = new Vector3();
  //   const baseQuaternion = new Quaternion();
  //   const baseScale = new Vector3();

  //   reticle.matrix.decompose(basePosition, baseQuaternion, baseScale);

  //   for (let i = 0; i < targets.length; i++) {

  //     const model = await loadData();
  //     if (!model) return;
  //     const offset = targets[i].position.clone();
  //     offset.applyQuaternion(baseQuaternion);

  //     model.position.copy(basePosition);
  //     let camera_position: Vector3 = new Vector3();
  //     camera.getWorldPosition(camera_position);
  //     model.lookAt(camera_position)

  //     scene.add(model);
  //   }
  // }

  controller1 = renderer.xr.getController(0);
  (controller1 as any).addEventListener('select', onSelectPokemon);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  (controller2 as any).addEventListener('select', onSelectPokemon);
  scene.add(controller2);

  reticle = new Mesh(
    new RingGeometry(0.15, 0.2, 32)
      .rotateX(-Math.PI / 2),
    new MeshBasicMaterial()
  );

  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
  // spawnPokemonAuto();
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
    // const intersects = raycaster.intersectObjects(listModelPokemon, true);


    // if (intersects.length > 0) {
    //   if (INTERSECTED != intersects[0].object) {

    //     if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    //     INTERSECTED = intersects[0].object;
    //     INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
    //     INTERSECTED.material.emissive.setHex(0xff0000);
    //   }

    // } else {
    //   if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    //   INTERSECTED = null;
    // }

    renderer.render(scene, camera);
  }
  renderer.render(scene, camera);
}

function gltfReader(gltf: GLTF) {
  const model = convertGLTFModel(gltf, 0.8);
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

async function loadData(): Promise<{ model: Object3D, name: string }> {
  const idPokemon: string = randomPokemon();
  if (!idPokemon) {
    console.log("fail");
    return { model: new Object3D(), name: "" };
  }
  return new Promise((resolve) => {
    new GLTFLoader()
      .setPath('assets/Pokemon_models/' + idPokemon)
      .setResourcePath('assets/Pokemon_models/' + idPokemon + '/images/')
      .load('/' + idPokemon.toLowerCase() + '.glb', (gltf) => {
        gltfReader(gltf);
        resolve({
          model: pokModel,
          name: idPokemon
        });
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
  let randomIndex = Math.floor(Math.random() * lstPokemon.length);
  while (randomIndex in listModelPokemonNames) {
    randomIndex = Math.floor(Math.random() * lstPokemon.length);
  }
  return lstPokemon[randomIndex];
}


async function spawnPokemonAuto() {
  if (listModelPokemon.length > 0) {
    return;
  }
  console.log("rentré");
  const nb_pokemon = sameTimeNumberPokemon; // nombre de pokemons
  const radius = 1.5;                  // rayon de la sphère
  targets = [];
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

  // console.log('targets');
  // console.log(targets);

  for (let j = 0; j < targets.length; j++) {
    // console.log("model" + j);
    const data = await loadData();
    const model = data.model;
    if (model) {
      model.position.copy(targets[j].position);
      // console.log(targets[j].position);

      model.lookAt(camera_position);
      model.updateMatrixWorld(true);
      addBoundingBoxHelper(model);
      model.updateMatrixWorld(true);
      model.name = data.name;
      scene.add(model);
      listModelPokemon.push(model)
      listModelPokemonNames.push(data.name);
      // console.log(model.position);
    }
  }
  // console.log(listModelPokemon)
  pokemonAchercher = randomName()
}

function addBoundingBoxHelper(model: Object3D) {
  model.updateWorldMatrix(true, true);
  const worldBox = new Box3().setFromObject(model);
  const worldCenter = worldBox.getCenter(new Vector3());
  const size = worldBox.getSize(new Vector3());
  const hitboxScale = 3.0;
  size.multiplyScalar(hitboxScale);
  const geometry = new BoxGeometry(size.x, size.y, size.z);
  const material = new MeshBasicMaterial({
    visible: false
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = "__hitbox__";
  const localCenter = model.worldToLocal(worldCenter.clone());
  mesh.position.copy(localCenter);
  model.add(mesh);
}

function onSelectPokemon() {

  if (listModelPokemon.length === 0) {
    spawnPokemonAuto();
    createText("");
    return;
  }
  if (pokemonAchercher === "") {
    return;
  }
  const ray = getCameraRay();
  const closest = getClosestPokemonToRay(ray, 1.0);
  if (closest) {
    console.log("Pokemon sélectionné :", closest.name);
    console.log("Pokemon à chercher :", pokemonAchercher);
    if (closest.name == pokemonAchercher) {
      score += 1;
      scene.remove(closest);
      const modelIndex = listModelPokemon.indexOf(closest);
      if (modelIndex > -1) {
        listModelPokemon.splice(modelIndex, 1);
      }
      const nameIndex = listModelPokemonNames.indexOf(closest.name);
      if (nameIndex > -1) {
        listModelPokemonNames.splice(nameIndex, 1);
      }
      pokemonAchercher = "";
      if (listModelPokemonNames.length === 0) {
        createText("Bravo ! \n Tu as trouvE tous les \n pokemons de ce niveau !");
        lives += 1;
        sameTimeNumberPokemon += 2;
        return;
      }
      pokemonAchercher = randomName();
      updateHUD();
    }
    else {
      lives -= 1;
      if (lives <= 0) {
        gameOver = true;
        updateHUD();
        return;
      }
      updateHUD("Erreur! \n");
    }
  }

  else {
    console.log("Aucun pokemon assez proche de la visée");
  }
}


function getClosestPokemonToRay(ray: Raycaster, maxDistance = 0.8): Object3D | null {
  let closestPokemon: Object3D | null = null;
  let closestDistance = Infinity;
  const origin = ray.ray.origin;
  const direction = ray.ray.direction;

  for (const pokemon of listModelPokemon) {
    const pos = new Vector3();
    pokemon.getWorldPosition(pos);
    const toPokemon = pos.clone().sub(origin);
    const projection = toPokemon.dot(direction);
    if (projection <= 0) continue;
    const closestPointOnRay = origin.clone().add(direction.clone().multiplyScalar(projection));
    const distanceToRay = pos.distanceTo(closestPointOnRay);
    if (distanceToRay < closestDistance && distanceToRay <= maxDistance) {
      closestDistance = distanceToRay;
      closestPokemon = pokemon;
    }
  }
  return closestPokemon;
}

function getCameraRay(): Raycaster {
  const ray = new Raycaster();
  const xrCamera = renderer.xr.getCamera();
  const origin = new Vector3();
  const direction = new Vector3(0, 0, -1);
  xrCamera.getWorldPosition(origin);
  direction.applyQuaternion(xrCamera.getWorldQuaternion(new Quaternion())).normalize();

  ray.set(origin, direction);
  return ray;
}

function createText(text: string): void {
  if (!font) return;
  if (currentText === text) return;
  currentText = text;
  if (textMesh) {
    camera.remove(textMesh);
    textMesh.geometry.dispose();
    const mat = textMesh.material;
    if (Array.isArray(mat)) {
      mat.forEach(m => m.dispose());
    } else {
      mat.dispose();
    }
    textMesh = null;
  }
  const geometry = new TextGeometry(text, {
    font: font,
    size: 0.020,
    depth: 0.003,
    curveSegments: 8,
  });
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box) {
    const center = box.getCenter(new Vector3());
    geometry.translate(-center.x, -center.y, -center.z);
  }
  const material = new MeshBasicMaterial({ color: 0xffffff });
  textMesh = new Mesh(geometry, material);
  textMesh.position.set(0, 0, -0.5); // devant la caméra
  camera.add(textMesh);
}


function randomName(): String {
  console.log(listModelPokemonNames);
  if (listModelPokemonNames.length === 0) {
    return "";
  }
  const index = Math.floor(Math.random() * listModelPokemonNames.length);
  createText("Trouve " + listModelPokemonNames[index] + " !");

  return listModelPokemonNames[index];
}

function updateHUD(message: string = ""): void {
  if (gameOver) {
    createText(`Perdu ! \nScore: ${score}`);
    return;
  }

  if (listModelPokemonNames.length === 0 && listModelPokemon.length >= 0) {
    createText(`Score: ${score} Vies: ${lives}`);
    return;
  }

  const prefix = message ? `${message}` : "";
  const target = pokemonAchercher ? `Trouve ${pokemonAchercher}` : "";
  createText(`${prefix}${target} \nscore: ${score}  vies: ${lives}`);
}
