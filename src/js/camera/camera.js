/* jshint esversion: 6 */

import Rect from '../services/rect';

export default class Camera extends THREE.PerspectiveCamera {

	constructor(container, scene) {
		super(10, container.offsetWidth / container.offsetHeight, 0.01, 2000);
		this.position.set(0, 0, 2);
		this.target = new THREE.Vector3();
		this.cameraRect = new Rect();
		this.zoom = 1;
		this.updateProjectionMatrix();
		scene.add(this);
	}

	setSize(w, h) {
		this.zoom = 1;
		this.aspect = w / h;
		this.position.z = 180 / this.aspect;
		const angle = this.fov * Math.PI / 180;
		const height = Math.abs(this.position.z * Math.tan(angle / 2) * 2);
		const cameraRect = this.cameraRect;
		cameraRect.width = height * this.aspect;
		cameraRect.height = height;
		this.updateProjectionMatrix();
	}

}
