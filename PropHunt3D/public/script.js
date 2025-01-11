const socket = io();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

const loader = new THREE.GLTFLoader();
let playerModel, playerProp, mixer, clock = new THREE.Clock();
let isMorphing = false;
let isHunter = false;

const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x228b22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const props = {
  crate: {
    model: new THREE.BoxGeometry(1, 1, 1),
    material: new THREE.MeshBasicMaterial({ color: 0x8b4513 }),
  },
  tree: {
    model: new THREE.CylinderGeometry(0.5, 0.5, 5, 10),
    material: new THREE.MeshBasicMaterial({ color: 0x228b22 }),
  },
  stone: {
    model: new THREE.SphereGeometry(1, 8, 8),
    material: new THREE.MeshBasicMaterial({ color: 0x808080 }),
  }
};

const propMeshes = [];

for (let prop in props) {
  const propMesh = new THREE.Mesh(props[prop].model, props[prop].material);
  propMesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
  scene.add(propMesh);
  propMeshes.push(propMesh);
}

camera.position.set(0, 10, 10);
camera.lookAt(0, 0, 0);

function loadPlayerModel() {
  const modelUrl = 'https://cdn.glitch.global/71795abf-9f92-4634-8bc6-bc2377154fe1/male_lowpoly_base_mesh.glb?v=1736630249686';
  loader.load(modelUrl, (gltf) => {
    playerModel = gltf.scene;
    mixer = new THREE.AnimationMixer(playerModel);
    gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
    playerModel.scale.set(1, 1, 1);
    playerModel.position.set(0, 0, 0);
    scene.add(playerModel);
  }, undefined, (error) => {
    console.error('Error loading model:', error);
  });
}

function morphIntoProp() {
  if (isMorphing) return;

  const randomProp = propMeshes[Math.floor(Math.random() * propMeshes.length)];
  playerProp = randomProp.clone();
  playerProp.position.set(playerModel.position.x, playerModel.position.y, playerModel.position.z);
  scene.add(playerProp);
  playerModel.visible = false;
  playerProp.visible = true;
  isMorphing = true;

  socket.emit('morph', playerModel.position, playerModel.rotation);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'm' && !isMorphing) {
    morphIntoProp();
  }
  if (event.key === 'w') {
    playerModel.position.z -= 0.1;
    if (playerProp) playerProp.position.z -= 0.1;
    if (!isMorphing) socket.emit('move', playerModel.position);
  }
  if (event.key === 's') {
    playerModel.position.z += 0.1;
    if (playerProp) playerProp.position.z += 0.1;
    if (!isMorphing) socket.emit('move', playerModel.position);
  }
  if (event.key === 'a') {
    playerModel.position.x -= 0.1;
    if (playerProp) playerProp.position.x -= 0.1;
    if (!isMorphing) socket.emit('move', playerModel.position);
  }
  if (event.key === 'd') {
    playerModel.position.x += 0.1;
    if (playerProp) playerProp.position.x += 0.1;
    if (!isMorphing) socket.emit('move', playerModel.position);
  }
});

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}

socket.on('morph', (playerId, position, rotation) => {
  if (playerId !== socket.id) {
    if (playerProp) {
      playerProp.position.set(position.x, position.y, position.z);
      playerProp.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  }
});

socket.on('setHunter', (hunterId) => {
  isHunter = (socket.id === hunterId);
});

socket.on('eliminate', (eliminatedId) => {
  if (eliminatedId !== socket.id) {
    console.log('You have been eliminated!');
  }
});

loadPlayerModel();
animate();

socket.on('move', (playerId, position) => {
  if (playerId !== socket.id && playerModel) {
    playerModel.position.set(position.x, position.y, position.z);
  }
});
