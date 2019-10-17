/* jshint esversion: 6 */

const MIN_DEVICE_PIXEL_RATIO = 1.25;

export default class Renderer extends THREE.WebGLRenderer {

	constructor(container) {
		super({
			antialias: true,
			// premultipliedAlpha: true,
			// preserveDrawingBuffer: false,
			alpha: true,
		});
		this.setClearColor(0xffffff, 0);
		this.setPixelRatio(Math.max(window.devicePixelRatio, MIN_DEVICE_PIXEL_RATIO));
		this.setSize(container.offsetWidth, container.offsetHeight);
		container.appendChild(this.domElement);
	}

	static getRenderer(container) {
		return new Renderer(container);
	}

}
