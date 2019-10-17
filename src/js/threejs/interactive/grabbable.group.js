/* jshint esversion: 6 */

import EmittableGroup from './emittable.group';

export default class GrabbableGroup extends EmittableGroup {

	static grabtest(controllers) {
		const down = controllers.gamepads.button;
		const controller = controllers.controller;
		const items = GrabbableGroup.items.filter(x => !x.freezed);
		let grabbedItem;
		if (controller && down && down.index === 2) {
			const controllerPosition = controller.parent.position;
			items.reduce((p, x, i) => {
				const distance = x.position.distanceTo(controllerPosition);
				if (distance <= 0.1) {
					if (distance < p) {
						grabbedItem = x;
						return distance;
					} else {
						return p;
					}
				}
				return p;
			}, Number.POSITIVE_INFINITY);
		} else {
			GrabbableGroup.items.filter(x => x.grab).forEach(x => x.grab = undefined);
		}
		items.forEach(x => {
			x.grab = x === grabbedItem ? controller : undefined;
		});
		return grabbedItem;
	}

	constructor() {
		super();
		GrabbableGroup.items.push(this);
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

}

GrabbableGroup.items = [];
GrabbableGroup.center = new THREE.Vector3();
