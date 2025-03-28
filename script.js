// Simple WebGL fractal using Three.js

let scene, camera, renderer, mesh;
let width = window.innerWidth;
let height = window.innerHeight;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    
    document.getElementById('webgl-canvas').appendChild(renderer.domElement);

    let geometry = new THREE.SphereGeometry(5, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color: 0x44aa88 });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 10;

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Add simple rotation to the mesh
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;

    renderer.render(scene, camera);
}

// Handle resizing of the browser window
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

init();