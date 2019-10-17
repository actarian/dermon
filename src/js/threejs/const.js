/* jshint esversion: 6 */
/* global window, document */

export const TEST_ENABLED = false;
export const VR_ENABLED = true;
export const ROOM_RADIUS = 200;
export const PANEL_RADIUS = 100;
export const POINT_RADIUS = 99;
export const POINTER_RADIUS = 98;
export const ORIGIN = new THREE.Vector3();

export const MODEL_TYPE = {
	PROFESSIONAL_27: 1,
	PROFESSIONAL_BLACK: 2,
	PROFESSIONAL_WHITE: 3,
	SCALARE_33: 4,
};

export function cm(value) {
	return value / 100;
}

export function mm(value) {
	return value / 1000;
}

export function deg(value) {
	return Math.PI / 180 * value;
}

export function addCube(parent) {
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const cube = new THREE.Mesh(geometry, material);
	parent.add(cube);
	return cube;
}

THREE.Euler.prototype.add = function(euler) {
	this.set(this.x + euler.x, this.y + euler.y, this.z + euler.z, this.order);
	return this;
};

export function cameraToPicture(cubeCamera, renderer, textureW) {
	console.assert(cubeCamera instanceof THREE.CubeCamera);
	textureW = textureW || cubeCamera.renderTarget.width;
	const scene = new THREE.Scene();

	const shader = THREE.ShaderLib.cube;
	const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
	const material = new THREE.ShaderMaterial({
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: uniforms,
		depthWrite: false,
		side: THREE.BackSide
	});
	// set the cubeCamera.renderTarget
	uniforms.tCube.value = cubeCamera.renderTarget;

	// init geometry
	const geometry = new THREE.BoxGeometry(500, 500, 500);
	const mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	// backup renderer parameters
	const old = {
		width: renderer.domElement.width,
		height: renderer.domElement.height,
		devicePixelRatio: renderer.devicePixelRatio,
	};
	// set new renderer parameters
	renderer.setSize(textureW, textureW);
	renderer.devicePixelRatio = 1;

	const images = [];
	cubeCamera.children.slice().forEach((subCamera) => {
		// render sceneRtt with subCamera
		renderer.render(scene, subCamera);
		// clone renderer.domElement
		const canvas = document.createElement('canvas');
		canvas.width = renderer.domElement.width;
		canvas.height = renderer.domElement.height;
		const context = canvas.getContext('2d');
		// mirror in y axis - im not sure why it is needed
		context.translate(0, canvas.height);
		context.scale(1, -1);
		// draw the image in the cloned canvas
		context.drawImage(renderer.domElement, 0, 0);
		// store cloned canvas
		images.push(canvas);
	});

	// restore renderer parameters
	renderer.devicePixelRatio = old.devicePixelRatio;
	renderer.setSize(old.width, old.height);

	mesh.dispose();
	geometry.dispose();
	material.dispose();
	// return the just-built image
	return images;
}
