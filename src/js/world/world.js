/* jshint esversion: 6 */

import Camera from '../camera/camera';
import Lights from '../lights/lights';
import Materials from '../materials/materials';
import Renderer from '../renderer/renderer';
import Scene from '../scene/scene';
import Emittable from '../threejs/interactive/emittable';

export default class World extends Emittable {

	constructor(container, product) {
		super();
		this.clock = new THREE.Clock();
		this.container = container;
		this.size = { width: 0, height: 0, aspect: 0 };
		const scene = this.scene = new Scene();
		const camera = this.camera = new Camera(container, scene);
		const renderer = this.renderer = new Renderer(container);
		const materials = this.materials = new Materials(renderer);
		const lights = this.lights = new Lights(scene);
		this.resize = this.resize.bind(this);
		this.resize();
		window.addEventListener('resize', this.resize, false);
		this.animate();
	}

	resize() {
		try {
			const container = this.container;
			const w = container.offsetWidth;
			const h = container.offsetHeight;
			const size = this.size;
			size.width = w;
			size.height = h;
			size.aspect = w / h;
			this.renderer.setSize(w, h);
			this.camera.setSize(w, h);
		} catch (error) {
			console.log('error', error);
		}
	}

	render(delta) {
		try {
			const renderer = this.renderer;
			const scene = this.scene;
			const time = this.clock.getElapsedTime();
			/*
			const delta = this.clock.getDelta();
			const tick = Math.floor(time * 60);
			*/
			this.lights.render(time);
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
