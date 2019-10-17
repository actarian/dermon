/* jshint esversion: 6 */

export default class FreezableMesh extends THREE.Mesh {

	static update(renderer, scene, camera, delta, time, tick) {
		FreezableMesh.items.forEach(x => {
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

	constructor(geometry, material) {
		geometry = geometry || new THREE.BoxGeometry(5, 5, 5);
		material = material || new THREE.MeshBasicMaterial({
			color: 0xff00ff,
			// opacity: 1,
			// transparent: true,
		});
		super(geometry, material);
		this.freezed = false;
		FreezableMesh.items.push(this);
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

FreezableMesh.items = [];
