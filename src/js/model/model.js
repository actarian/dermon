/* jshint esversion: 6 */

import DomService from '../services/dom.service';
const deg = THREE.Math.degToRad;

const domService = DomService.get();

export default class Model {

	constructor(node, world) {
		this.node = node;
		this.world = world;
		this.load((model) => {
			this.set(model);
		});
	}

	load(callback) {
		const loader = new THREE.FBXLoader();
		loader.load('./threejs/models/latte-corpo.fbx', (object) => {
				object.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						if (child.name === 'MODEL_PLASTIC_COSMETIC_TUBE_1483_PART_1_N3D') {
							child.material = this.world.materials.tubetto;
						} else {
							child.material = this.world.materials.white;
						}
						console.log(child.name, child.material);
						child.material.roughness = 0.1;
					}
				});
				if (typeof callback === 'function') {
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
			this.update(event.intersection, event.windowRect, world.viewRect);
		});
	}

	update(intersection, windowRect, viewRect) {
		const sx = intersection.width / windowRect.width * 1; // * viewRect.width;
		const sy = intersection.height / windowRect.height * 1; // * viewRect.height;
		const tx = intersection.x * viewRect.width / windowRect.width - viewRect.width / 2;
		const ty = intersection.y * viewRect.height / windowRect.height - viewRect.height / 2;
		// console.log(intersection.width, viewRect.width, windowRect.width);
		const pow = 1 - intersection.pow.y;
		const scale = Math.min(sx, sy);
		const model = this.model;
		model.scale.x = model.scale.y = model.scale.z = scale;
		model.rotation.y = -deg(30) + deg(60) * pow;
		model.rotation.z = -deg(15) + deg(30) * pow;
		model.position.x = tx + (-1 + 2 * pow) * scale;
		model.position.y = -ty;
		console.log('model', ty, scale);
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
