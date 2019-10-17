/* jshint esversion: 6 */

export default class FreezableGroup extends THREE.Group {

	static update(renderer, scene, camera, delta, time, tick) {
		FreezableGroup.items.forEach(x => {
			if (x.parent) {
				x.onUpdate(renderer, scene, camera, x, delta, time, tick);
			}
		});
	}

	get freezed() {
		return this.freezed_;
	}

	set freezed(freezed) {
		// !!! cycle through freezable and not freezable
		this.freezed_ = freezed;
		this.children.filter(x => x.__lookupGetter__('freezed')).forEach(x => x.freezed = freezed);
	}

	constructor() {
		super();
		this.freezed = false;
		FreezableGroup.items.push(this);
	}

	freeze() {
		this.freezed = true;
	}

	unfreeze() {
		this.freezed = false;
	}

	onUpdate(renderer, scene, camera, object, delta, tick) {
		// noop
	}

}

FreezableGroup.items = [];
