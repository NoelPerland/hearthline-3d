import * as THREE from '../vendor/three/build/three.module.js';

// Fixed pools keep repeated movement clicks from creating meshes or materials.
export function createMovementEffects(scene, heightAt, reduced) {
  const group = new THREE.Group();
  scene.add(group);
  const material = new THREE.MeshBasicMaterial({ color: '#11a8b3', transparent: true, opacity: .8, depthWrite: false });
  const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(.065, 8), material, 48);
  const pose = new THREE.Object3D();
  dots.count = 0;
  group.add(dots);
  const ringMaterial = material.clone();
  const ring = new THREE.Mesh(new THREE.RingGeometry(.31, .37, 40), ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  group.add(ring);
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(.13), material);
  beacon.visible = false;
  group.add(beacon);
  const dustMaterial = new THREE.MeshBasicMaterial({ color: '#f3e5b9', transparent: true, opacity: .35, depthWrite: false });
  const dust = Array.from({ length: 12 }, () => {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(.11, 10), dustMaterial.clone());
    mesh.rotation.x = -Math.PI / 2; mesh.visible = false; group.add(mesh);
    return { mesh, life: 1 };
  });
  let route = [], destination = null, arrival = -1, last = null, stride = 0, dustIndex = 0, step = 0;
  function clear() { route = []; destination = null; dots.count = 0; ring.visible = beacon.visible = false; arrival = -1; }
  function setRoute(from, points) {
    route = [from, ...points].map(p => [...p]);
    destination = [...points.at(-1)]; arrival = -1; stride = 0; last = [...from];
    ring.position.set(destination[0], heightAt(...destination) + .075, destination[1]);
    ring.visible = true; beacon.visible = !reduced.matches;
  }
  function update(dt, time, player, remaining = []) {
    const travelled = last ? Math.hypot(player[0] - last[0], player[1] - last[1]) : 0;
    stride += travelled; last = [...player];
    if (dt > 0 && travelled > .001 && stride > .5 && !reduced.matches) {
      stride = 0; const p = dust[dustIndex++ % dust.length]; p.life = 0;
      p.mesh.position.set(player[0] + (step++ % 2 ? .13 : -.13), heightAt(...player) + .055, player[1]); p.mesh.visible = true;
    }
    for (const p of dust) if (p.life < 1) {
      p.life = Math.min(1, p.life + dt / .55); p.mesh.scale.setScalar(.5 + p.life * 1.5);
      p.mesh.material.opacity = (1 - p.life) * .32; p.mesh.visible = p.life < 1 && !reduced.matches;
    }
    if (!destination) return;
    route = [player, ...remaining];
    if (arrival < 0 && Math.hypot(player[0] - destination[0], player[1] - destination[1]) < .23) { arrival = 0; dots.count = 0; beacon.visible = false; }
    if (arrival >= 0) {
      arrival += dt; ring.scale.setScalar(reduced.matches ? 1 : 1 + arrival * 1.8); ringMaterial.opacity = Math.max(0, 1 - arrival / .7);
      if (arrival > .7) clear(); return;
    }
    ring.scale.setScalar(reduced.matches ? 1 : 1 + Math.sin(time * 4) * .09); ringMaterial.opacity = .85;
    beacon.position.set(destination[0], heightAt(...destination) + .6 + (reduced.matches ? 0 : Math.sin(time * 4) * .08), destination[1]);
    if (!reduced.matches) beacon.rotation.y = time * 1.4;
    let count = 0;
    for (let i = 1; i < route.length && count < 48; i++) {
      const a = i === 1 ? player : route[i - 1], b = route[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let d = .3; d < length && count < 48; d += .65) {
        const x = a[0] + (b[0] - a[0]) * d / length, z = a[1] + (b[1] - a[1]) * d / length;
        pose.position.set(x, heightAt(x, z) + .06, z); pose.rotation.set(-Math.PI / 2, 0, 0);
        pose.scale.setScalar(reduced.matches ? 1 : .85 + Math.sin(time * 5 - count * .5) * .15); pose.updateMatrix(); dots.setMatrixAt(count++, pose.matrix);
      }
    }
    dots.count = count; dots.instanceMatrix.needsUpdate = true;
  }
  return { setRoute, clear, update, metrics: () => ({ destination, dots: dots.count, dust: dust.filter(p => p.mesh.visible).length, arriving: arrival >= 0 }) };
}
