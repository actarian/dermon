/* jshint esversion: 6 */

import Materials from '../materials/materials';
import Rect from '../services/rect';
import Emittable from '../threejs/interactive/emittable';

const CAMERA_DISTANCE = 2;
const MIN_DEVICE_PIXEL_RATIO = 1;

export default class World extends Emittable {

	constructor(container, product) {
		super();
		this.clock = new THREE.Clock();
		this.container = container;
		this.size = { width: 0, height: 0, aspect: 0 };
		this.viewRect = new Rect();
		const scene = this.scene = this.addScene();
		const camera = this.camera = this.addCamera();
		scene.add(camera);
		const renderer = this.renderer = this.addRenderer();
		const materials = this.materials = new Materials(renderer);
		const lights = this.lights = this.addLights(scene);
		/*
		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
		*/
		this.onWindowResize = this.onWindowResize.bind(this);
		this.onWindowResize();
		window.addEventListener('resize', this.onWindowResize, false);
		this.animate();
	}

	addScene() {
		const scene = new THREE.Scene();
		// scene.background = new THREE.Color(0x00000000);
		// scene.background = new THREE.Color(0x404040);
		scene.fog = new THREE.Fog(scene.background, 10, 700);
		return scene;
	}

	addCamera() {
		const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.01, 2000);
		camera.position.set(0, 0, 2);
		camera.target = new THREE.Vector3();
		camera.zoom = 1;
		camera.updateProjectionMatrix();
		return camera;
	}

	addRenderer() {
		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			// premultipliedAlpha: true,
			// preserveDrawingBuffer: false,
			alpha: true,
		});
		this.renderer = renderer;
		renderer.setClearColor(0xffffff, 0);
		renderer.setPixelRatio(Math.max(window.devicePixelRatio, MIN_DEVICE_PIXEL_RATIO));
		renderer.setSize(window.innerWidth, window.innerHeight);
		this.container.appendChild(renderer.domElement);
		return renderer;
	}

	addLights(parent) {
		const lights = new THREE.Group();
		lights.rotationScroll = new THREE.Vector3();
		lights.rotationTime = new THREE.Vector3();
		const light0 = new THREE.HemisphereLight(0xffffff, 0x666666, 0.2);
		light0.position.set(0, 0, 0);
		lights.light0 = light0;
		parent.add(light0);
		const light1 = new THREE.DirectionalLight(0xffffff, 0.1);
		light1.position.set(-20, 30, 50);
		lights.light1 = light1;
		lights.add(light1);
		const light2 = new THREE.DirectionalLight(0xffffff, 0.1);
		light2.position.set(20, -30, 50);
		lights.light2 = light2;
		lights.add(light2);
		parent.add(lights);
		return lights;
	}

	onWindowResize() {
		try {
			const container = this.container,
				renderer = this.renderer,
				camera = this.camera;
			const size = this.size;
			size.width = container.offsetWidth;
			size.height = container.offsetHeight;
			const w = size.width;
			const h = size.height;
			size.aspect = w / h;
			if (renderer) {
				renderer.setSize(w, h);
			}
			if (camera) {
				camera.zoom = 1;
				camera.aspect = w / h;
				camera.position.z = 180 / camera.aspect;
				camera.updateProjectionMatrix();
				const viewRect = this.viewRect;
				const angle = camera.fov * Math.PI / 180;
				const height = Math.abs(camera.position.z * Math.tan(angle / 2) * 2);
				viewRect.width = height * camera.aspect;
				viewRect.height = height;
			}
		} catch (error) {
			console.log('error', error);
		}
	}

	render(delta) {
		try {
			const renderer = this.renderer;
			const scene = this.scene;
			/*
			const delta = this.clock.getDelta();
			*/
			const time = this.clock.getElapsedTime();
			const tick = Math.floor(time * 60);
			this.lights.rotationTime.y += 0.004;
			// this.lights.rotation.y = this.lights.rotationScroll.y + this.lights.rotationTime.y;
			this.lights.rotation.y = THREE.Math.degToRad(15) * Math.cos(time * 0.1);
			const camera = this.camera;
			renderer.render(scene, camera);
		} catch (error) {
			console.log('error', error);
		}

	}

	animate() {
		const renderer = this.renderer;
		renderer.setAnimationLoop(() => {
			this.render();
		});
	}

	static init() {
		[...document.querySelectorAll('[example-01]')].map(x => new World(x));
	}

}
