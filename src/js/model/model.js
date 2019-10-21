/* jshint esversion: 6 */

import Ease from '../ease/ease';
import DomService from '../services/dom.service';

const deg = THREE.Math.degToRad;

const domService = DomService.get();

export default class Model {

	constructor(node, world) {
		this.node = node;
		this.world = world;
		this.key = node.getAttribute('model');
		this.load((model) => {
			this.set(model);
		});
	}

	load(callback) {
		const loader = new THREE.FBXLoader();
		loader.load('./three/models/' + this.key + '/' + this.key + '.fbx', (object) => {
				object.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						const white = this.world.materials.white;
						let material;
						switch (this.key) {
							case 'doccia-schiuma':
								material = this.world.materials.docciaSchiuma;
								if (child.name === 'corpo') {
									child.material = material;
								} else {
									child.material = white;
								}
								break;
							case 'latte-corpo':
								material = this.world.materials.latteCorpo;
								if (child.name === 'model') {
									child.material = material;
								} else {
									child.material = white;
								}
								break;
						}
						console.log(this.key, '>', child.name, child.material);
					}
				});
				if (typeof callback === 'function') {
					console.log(this.key, '>', object);
					callback(object);
				}
			},
			(xhr) => {
				// console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},
			(error) => {
				console.log('An error happened', error);
			}
		);
	}

	set(model) {
		const node = this.node;
		const world = this.world;
		this.model = model;
		world.scene.add(model);
		domService.scrollIntersection$(node).subscribe(event => {
			this.update(event.intersection, event.windowRect, world.camera.viewRect);
		});
	}

	update(intersection, windowRect, viewRect) {
		const sx = intersection.width / windowRect.width * 1; // * viewRect.width;
		const sy = intersection.height / windowRect.height * 1; // * viewRect.height;
		const tx = intersection.x * viewRect.width / windowRect.width - viewRect.width / 2;
		const ty = intersection.y * viewRect.height / windowRect.height - viewRect.height / 2;
		// console.log(intersection.width, viewRect.width, windowRect.width);
		const model = this.model;

		let pow, scale;
		switch (this.key) {
			case 'doccia-schiuma':
				pow = Ease.Quad.InOut(1 - intersection.offset(500));
				scale = Math.min(sx, sy) * 0.8;
				model.scale.x = model.scale.y = model.scale.z = scale;
				// model.rotation.y = -deg(20) + deg(40) * pow;
				// model.rotation.z = -deg(10) + deg(20) * pow;
				// model.position.x = tx - (1 - 2 * pow) * scale * 3;
				// model.position.y = -ty;
				model.rotation.x = -deg(5);
				model.rotation.y = deg(5);
				model.rotation.z = deg(35) + deg(20) - deg(40) * pow;
				model.position.x = tx;
				model.position.y = -ty + (-20 + 20 * pow) * scale;
				break;
			case 'latte-corpo':
				pow = Ease.Quad.Out(1 - intersection.pow.y);
				scale = Math.min(sx, sy) * 0.9;
				model.scale.x = model.scale.y = model.scale.z = scale;
				model.rotation.y = -deg(20) + deg(40) * pow;
				model.rotation.z = -deg(10) + deg(20) * pow;
				model.position.x = tx - (1 - 2 * pow) * scale * 3;
				model.position.y = -ty;
				break;
		}
		// console.log('model', ty, scale);
	}

	cube(callback) {
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
		const mesh = new THREE.Mesh(geometry, material);
		if (typeof callback === 'function') {
			callback(mesh);
		}
		return mesh;
	}

}
