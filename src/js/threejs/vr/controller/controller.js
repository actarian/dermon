/* jshint esversion: 6 */

import { cm, mm } from '../../const';
import EmittableGroup from '../../interactive/emittable.group';
import { GAMEPAD_HANDS } from '../gamepads';

export default class Controller extends EmittableGroup {

	get ready() {
		return this.ready_;
	}

	set ready(ready) {
		if (this.ready_ !== ready) {
			this.ready_ = ready;
			if (ready) {
				this.emit('ready', this);
			}
		}
	}

	get active() {
		return this.active_;
	}

	set active(active) {
		if (this.active_ !== active) {
			this.active_ = active;
			if (active) {
				this.add(this.ray);
			} else {
				this.remove(this.ray);
			}
		}
	}

	constructor(parent, gamepad, options = {}) {
		super();
		// this.ready = false;
		this.buttons = new Array(10).fill(0).map(x => {
			return { value: 0 };
		});
		this.axis = new Array(2).fill(0).map(x => new THREE.Vector2());
		this.linearVelocity = new THREE.Vector3();
		this.angularVelocity = new THREE.Vector3();
		this.boundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		this.box = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		this.parent = parent;
		this.gamepad = gamepad;
		this.options = options;
		this.hand = gamepad.hand;
		const model = this.model = this.addModel(this.hand);
		const ray = this.ray = this.addRay(this.hand);
		this.add(model);
		parent.add(this);
		this.addEvents();
	}

	updateBoundingBox() {
		// In the animation loop, to keep the bounding box updated after move/rotate/scale operations
		this.parent.updateMatrixWorld(true);
		this.box.copy(this.boundingBox).applyMatrix4(this.parent.matrixWorld);
		// console.log('updateBoundingBox', this.box);
		return this.box;
	}

	updateVelocity() {
		let previousPosition = this.previousPosition_;
		if (previousPosition) {
			this.linearVelocity.subVectors(this.parent.position, previousPosition);
		} else {
			previousPosition = this.previousPosition_ = new THREE.Vector3();
		}
		previousPosition.copy(this.parent.position);
		let previousRotation = this.previousRotation_;
		if (previousRotation) {
			this.angularVelocity.subVectors(this.parent.rotation, previousRotation);
		} else {
			previousRotation = this.previousRotation_ = new THREE.Vector3();
		}
		previousRotation.copy(this.parent.rotation);
	}

	addEvents() {
		this.onActivate = this.onActivate.bind(this);
		this.onDeactivate = this.onDeactivate.bind(this);
		this.onPress = this.onPress.bind(this);
		this.onRelease = this.onRelease.bind(this);
		this.onAxis = this.onAxis.bind(this);
		const gamepad = this.gamepad;
		gamepad.on('activate', this.onActivate);
		gamepad.on('deactivate', this.onDeactivate);
		gamepad.on('press', this.onPress);
		gamepad.on('release', this.onRelease);
		gamepad.on('axis', this.onAxis);
	}

	removeEvents() {
		const gamepad = this.gamepad;
		gamepad.off('activate', this.onActivate);
		gamepad.off('deactivate', this.onActivate);
		gamepad.off('press', this.onPress);
		gamepad.off('release', this.onRelease);
		gamepad.off('axis', this.onAxis);
	}

	onActivate(gamepad) {
		this.active = true;
	}
	onDeactivate(gamepad) {
		this.active = false;
	}
	onPress(button) {
		this.press(button.index);
	}
	onRelease(button) {
		this.release(button.index);
	}
	onAxis(axis) {
		this.axis[axis.index] = axis;
	}

	destroy() {
		this.removeEvents();
		this.gamepad = null;
	}

	addModel(hand) {
		const geometry = new THREE.CylinderBufferGeometry(cm(2), cm(2), cm(12), 24);
		geometry.rotateX(Math.PI / 2);
		const texture = new THREE.TextureLoader().load('threejs/matcap/matcap-12.jpg');
		const material = new THREE.MeshMatcapMaterial({
			color: this.hand === GAMEPAD_HANDS.RIGHT ? 0x991111 : 0x111199,
			matcap: texture,
			// transparent: true,
			// opacity: 1,
		});
		const mesh = new THREE.Mesh(geometry, material);
		// geometry.computeBoundingBox();
		this.boundingBox.setFromObject(mesh);
		this.ready = true;
		return mesh;
	}

	addRay(hand) {
		const geometry = new THREE.CylinderBufferGeometry(mm(1), mm(0.5), cm(30), 5); // 10, 12
		geometry.rotateX(Math.PI / 2);
		const material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.5,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, 0, -cm(18.5));
		return mesh;
	}

	press(index) {
		TweenMax.to(this.buttons[index], 0.3, {
			value: 1,
			ease: Power2.easeOut,
		});
	}

	release(index) {
		TweenMax.to(this.buttons[index], 0.3, {
			value: 0,
			ease: Power2.easeOut,
		});
	}

	update(tick) {}

	static getCos(tick, i = 0) {
		return Math.cos(i + tick * 0.1);
	}

	static mixColor(color, a, b, value) {
		return color.setRGB(
			a.r + (b.r - a.r) * value,
			a.g + (b.g - a.g) * value,
			a.b + (b.b - a.b) * value
		);
	}

	static mixUniformColor(uniform, a, b, value) {
		uniform.value.r = a.r + (b.r - a.r) * value;
		uniform.value.g = a.g + (b.g - a.g) * value;
		uniform.value.b = a.b + (b.b - a.b) * value;
	}
}

// Controller.clock = new THREE.Clock();
// const clock = this.clock || (this.clock = new THREE.Clock());
