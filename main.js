"use strict";
// ⚠️ DO NOT EDIT main.js DIRECTLY ⚠️
// This file is generated from the TypeScript source main.ts
// Any changes made here will be overwritten.
// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)
import { AmbientLight, Timer, CylinderGeometry, HemisphereLight, Mesh, MeshNormalMaterial, MeshPhongMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
// XR
import { XRButton } from 'three/addons/webxr/XRButton.js';
// If you prefer to import the whole library, with the THREE prefix, use the following line instead:
// import * as THREE from 'three'
// NOTE: three/addons alias is supported by Rollup: you can use it interchangeably with three/examples/jsm/  
// Importing Ammo can be tricky.
// Vite supports webassembly: https://vitejs.dev/guide/features.html#webassembly
// so in theory this should work:
//
// import ammoinit from 'three/addons/libs/ammo.wasm.js?init';
// ammoinit().then((AmmoLib) => {
//  Ammo = AmmoLib.exports.Ammo()
// })
//
// But the Ammo lib bundled with the THREE js examples does not seem to export modules properly.
// A solution is to treat this library as a standalone file and copy it using 'vite-plugin-static-copy'.
// See vite.config.js
// 
// Consider using alternatives like Oimo or cannon-es
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
// Example of hard link to official repo for data, if needed
// const MODEL_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/r173/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';
// INSERT CODE HERE
let camera, scene, renderer;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
const timer = new Timer();
timer.connect(document);
const init = () => {
    scene = new Scene();
    const aspect = window.innerWidth / window.innerHeight;
    camera = new PerspectiveCamera(75, aspect, 0.1, 10); // meters
    camera.position.set(0, 1.6, 3);
    const light = new AmbientLight(0xffffff, 1.0); // soft white light
    scene.add(light);
    const hemiLight = new HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate); // requestAnimationFrame() replacement, compatible with XR 
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(ARButton.createButton(renderer));
    /*
    document.body.appendChild( XRButton.createButton( renderer, {
      'optionalFeatures': [ 'depth-sensing' ],
      'depthSensing': { 'usagePreference': [ 'gpu-optimized' ], 'dataFormatPreference': [] }
    } ) );
  */
    const xrButton = XRButton.createButton(renderer, {});
    xrButton.style.backgroundColor = 'skyblue';
    document.body.appendChild(xrButton);
    const controls = new OrbitControls(camera, renderer.domElement);
    //controls.listenToKeyEvents(window); // optional
    controls.target.set(0, 1.6, 0);
    controls.update();
    // Handle input: see THREE.js webxr_ar_cones
    const geometry = new CylinderGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2);
    const material = new MeshNormalMaterial();
    reticle = new Mesh(geometry, material);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    const controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);
    window.addEventListener('resize', onWindowResize, false);
};
init();
const geometry = new CylinderGeometry(0.1, 0.1, 0.2, 32).translate(0, 0.1, 0);
function onSelect() {
    if (reticle.visible) {
        const material = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
        const mesh = new Mesh(geometry, material);
        reticle.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
        mesh.scale.y = Math.random() * 2 + 1;
        scene.add(mesh);
    }
}
timer.update();
const delta = timer.getDelta();
const elapsed = timer.getElapsed();
function animate(_timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        if (hitTestSourceRequested === false && session) {
            session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                if (session.requestHitTestSource) {
                    const hitTestSourcePromise = session.requestHitTestSource({ space: referenceSpace });
                    if (hitTestSourcePromise) {
                        hitTestSourcePromise.then(function (source) {
                            hitTestSource = source;
                        });
                    }
                }
            });
            session.addEventListener('end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });
            hitTestSourceRequested = true;
        }
        if (hitTestSource && referenceSpace) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                if (pose) {
                    reticle.visible = true;
                    reticle.matrix.fromArray(pose.transform.matrix);
                }
                else {
                    reticle.visible = false;
                }
            }
            else {
                reticle.visible = false;
            }
        }
    }
    renderer.render(scene, camera);
}
//
/*
function loadData() {
  new GLTFLoader()
    .setPath('assets/models/')
    .load('test.glb', gltfReader);
}


function gltfReader(gltf) {
  let testModel = null;

  testModel = gltf.scene;

  if (testModel != null) {
    console.log("Model loaded:  " + testModel);
    scene.add(gltf.scene);
  } else {
    console.log("Load FAILED.  ");
  }
}

loadData();
*/
// camera.position.z = 3;
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
//# sourceMappingURL=main.js.map