/* jshint esversion: 6 */

import EmittableMesh from './emittable.mesh';

export default class InteractiveMesh extends EmittableMesh {

	static hittest(raycaster, down, controller) {
		const items = InteractiveMesh.items.filter(x => !x.freezed);
		let grabbedItem;
		if (controller && down && down.index === 2) {
			const controllerPosition = controller.parent.position;
			const controllerBox = controller.updateBoundingBox();
			// const controllerBoxCenter = controllerBox.getCenter(this.center);
			// console.log(controllerBoxCenter.x, controllerBoxCenter.y, controllerBoxCenter.z);
			items.reduce((p, x, i) => {
				const distance = x.position.distanceTo(controllerPosition);
				// const intersect = controllerBox.intersectsBox(x.updateBoundingBox());
				if (distance <= 0.1) { // intersect) {
					// const center = x.box.getCenter(this.center);
					// const distance = controllerBox.distanceToPoint(center);
					// console.log(distance);
					// console.log(center, intersect, distance, p);
					if (distance < p) {
						grabbedItem = x;
						return distance;
					} else {
						return p;
					}
				}
				return p;
			}, Number.POSITIVE_INFINITY);
			// const origin = raycaster.origin;
			// console.log(controllerBox, down);
		} else {
			InteractiveMesh.items.filter(x => x.grab).forEach(x => x.grab = undefined);
		}
		if (grabbedItem) {
			// console.log(grabbedItem);
			items.forEach(x => {
				x.grab = x === grabbedItem ? controller : undefined;
			});
			return grabbedItem;
		} else {
			const intersections = raycaster.intersectObjects(items);
			let key, hit;
			const hash = {};
			intersections.forEach((intersection, i) => {
				const object = intersection.object;
				key = object.id;
				if (i === 0 && InteractiveMesh.object != object) {
					InteractiveMesh.object = object;
					hit = object;
					// haptic feedback
				}
				hash[key] = intersection;
			});
			items.forEach(x => {
				const intersection = hash[x.id]; // intersections.find(i => i.object === x);
				x.intersection = intersection;
				x.over = intersection !== undefined;
				x.down = down;
			});
			return hit;
		}
	}

	constructor(geometry, material) {
		super(geometry, material);
		geometry.computeBoundingBox();
		this.box = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		// this.renderOrder = 10;
		InteractiveMesh.items.push(this);
	}

	updateBoundingBox() {
		// In the animation loop, to keep the bounding box updated after move/rotate/scale operations
		this.updateMatrixWorld(true);
		this.box.copy(this.geometry.boundingBox).applyMatrix4(this.matrixWorld);
		// console.log('updateBoundingBox', this.box);
		return this.box;
	}

	get grab() {
		return this.grab_;
	}
	set grab(grab) {
		if (this.grab_ !== grab) {
			const grab_ = this.grab_;
			this.grab_ = grab;
			if (grab) {
				this.emit('grab', grab);
			} else {
				this.emit('release', grab_);
			}
		}
	}

	get over() {
		return this.over_;
	}
	set over(over) {
		if (over) {
			this.emit('hit', this);
		}
		if (this.over_ !== over) {
			this.over_ = over;
			if (over) {
				this.emit('over', this);
			} else {
				this.emit('out', this);
			}
		}
	}

	get down() {
		return this.down_;
	}
	set down(down) {
		down = down && this.over;
		if (this.down_ !== down) {
			this.down_ = down;
			if (down) {
				this.emit('down', this);
			} else {
				this.emit('up', this);
			}
		}
	}

}

InteractiveMesh.items = [];
InteractiveMesh.center = new THREE.Vector3();
