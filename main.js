import { PerspectiveCamera, Scene, WebGLRenderer, BoxGeometry, Mesh, Box3, Vector3, Object3D, MeshBasicMaterial, HemisphereLight, Quaternion, RingGeometry, } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
let container;
let camera;
let scene;
let renderer;
let controller1;
let controller2;
let reticle;
let pokModel;
let hitTestSource = null;
let hitTestSourceRequested = false;
let lstPokemon = [];
let dummyscale = new Vector3();
let dummyquaternion = new Quaternion();
const geometry = new BoxGeometry(0.3, 0.3, 0.3);
const material = new MeshBasicMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);
let sameTimeNumberPokemon = 8;
// const radiusTop: number = 0, radiusBottom: number = 5, height: number = 5, radialSegments: number = sameTimeNumberPokemon, heightSegments: number = 1;
// const openEnded: boolean = true, thetaStart: number = 0, thetaLength: number = Math.PI * 2;
// const cGeometry = new CylinderGeometry(
//   radiusTop, radiusBottom, height, radialSegments,
//   heightSegments, openEnded, thetaStart, thetaLength)
// const material = new MeshBasicMaterial({ color: 0xffff00 });
// const cone = new Mesh(cGeometry, material);
// const position = cGeometry.attributes.position;
// console.log(position)
// let lstPosition = []
// for (let i = 0; i < position.count; i++) {
//   let currentPos = position.array.slice(i * 3, i * 3 + 3);
//   lstPosition.push(new Vector3(currentPos[0], currentPos[1], currentPos[2]));
// }
const nb_pokemon = 10; // nombre de pokemons
const radius = 1.5;
const targets = [];
const vector = new Vector3();
// for (let i = 0; i < nb_pokemon; i++) {
//   const phi = Math.acos(-1 + (2 * i) / nb_pokemon);
//   const theta = Math.sqrt(nb_pokemon * Math.PI) * phi;
//   const object = new Object3D();
//   object.position.setFromSphericalCoords(radius, phi, theta);
//   vector.copy(object.position).multiplyScalar(2);
//   object.lookAt(vector);
//   targets.push(object);
// }
// console.log(lstPosition)
// scene.add( cone );
async function listPokemonLoad() {
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
function init() {
    container = document.createElement('div');
    document.body.appendChild(container);
    scene = new Scene();
    camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
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
    document.body.appendChild(ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test']
    }));
    async function onSelect() {
        if (!reticle.visible)
            return;
        const basePosition = new Vector3();
        const baseQuaternion = new Quaternion();
        const baseScale = new Vector3();
        reticle.matrix.decompose(basePosition, baseQuaternion, baseScale);
        for (let i = 0; i < targets.length; i++) {
            const model = await loadData();
            if (!model)
                return;
            const offset = targets[i].position.clone();
            offset.applyQuaternion(baseQuaternion);
            model.position.copy(basePosition);
            let camera_position = new Vector3();
            camera.getWorldPosition(camera_position);
            model.lookAt(camera_position);
            scene.add(model);
        }
    }
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('select', spawnPokemonAuto);
    scene.add(controller1);
    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('select', spawnPokemonAuto);
    scene.add(controller2);
    reticle = new Mesh(new RingGeometry(0.15, 0.2, 32)
        .rotateX(-Math.PI / 2), new MeshBasicMaterial());
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    window.addEventListener('resize', onWindowResize);
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        if (!session || !referenceSpace)
            return;
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
            }
            else {
                reticle.visible = false;
            }
        }
    }
    renderer.render(scene, camera);
}
function gltfReader(gltf) {
    const model = convertGLTFModel(gltf, 1);
    model.traverse((obj) => {
        if (obj.isMesh) {
            const mesh = obj;
            // mesh.material = originalMaterials.get(mesh)!;
        }
    });
    model.traverse((obj) => {
        obj.layers.set(1);
    });
    pokModel = model;
}
async function loadData() {
    const idPokemon = randomPokemon();
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
function convertGLTFModel(gltf, maxAllowedSize = 0.50) {
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
function randomPokemon() {
    const randomIndex = Math.floor(Math.random() * lstPokemon.length);
    return lstPokemon[randomIndex];
}
async function spawnPokemonAuto() {
    console.log("rentré");
    const nb_pokemon = sameTimeNumberPokemon; // nombre de pokemons
    const radius = 1.5; // rayon de la sphère
    const targets = [];
    const vector = new Vector3();
    let camera_position = new Vector3();
    camera.getWorldPosition(camera_position);
    for (let i = 0; i < nb_pokemon; i++) {
        console.log("bcl1");
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
        // console.log(targets[j].position);
        // const cube = new Mesh(geometry, material);
        // cube.position.copy(targets[j].position);
        // cube.lookAt(camera_position);
        // scene.add(cube);
        const model = await loadData();
        if (model) {
            model.position.copy(targets[j].position);
            // console.log(targets[j].position);
            model.lookAt(camera_position);
            scene.add(model);
        }
    }
}
//# sourceMappingURL=main.js.map