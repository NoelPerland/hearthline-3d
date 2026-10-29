import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/build/three.module.js';
import {createMovementEffects} from '../src/movement-effects.js';

for (const reduced of [false, true]) {
  const scene = new THREE.Scene();
  const effects = createMovementEffects(scene, () => 0, {matches: reduced});
  const meshes = [];
  scene.traverse(object => {if (object.isMesh) meshes.push(object);});
  for (let i = 0; i < 100; i++) {
    effects.setRoute([0, 0], [[2, 0], [2, 3]]);
    effects.update(.1, i, [0, 0], [[2, 0], [2, 3]]);
    assert(effects.metrics().dots > 0 && effects.metrics().dots <= 48);
    effects.update(.1, i, [1, 0], [[2, 0], [2, 3]]);
    if (reduced) assert.equal(effects.metrics().dust, 0);
    effects.update(.1, i, [2, 3], []);
    assert(effects.metrics().arriving);
    effects.update(.8, i, [2, 3], []);
    assert.equal(effects.metrics().destination, null);
  }
  const finalMeshes = [];
  scene.traverse(object => {if (object.isMesh) finalMeshes.push(object);});
  assert.equal(finalMeshes.length, meshes.length);
  effects.setRoute([0,0], [[5,0]]); effects.clear();
  assert.equal(effects.metrics().dots, 0);
}
console.log('PASS: bounded movement effects, route dots, arrivals, cancellation and reduced motion.');
