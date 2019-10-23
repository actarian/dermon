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
						switch (this.key) {
							case 'doccia-schiuma':
								if (child.name === 'corpo') {
									child.material = this.world.materials.docciaSchiuma.clone();
								} else {
									child.material = this.world.materials.white.clone();
								}
								break;
							case 'gel-mousse-doccia':
								switch (child.name) {
									case 'spray_bottle':
										child.renderOrder = 1;
										child.material = this.world.materials.gelMousseDoccia.clone();
										break;
									case 'tappo':
										child.renderOrder = 3;
										child.material = this.world.materials.transparent.clone();
										break;
									case 'spray':
									case 'cilindro1':
									case 'cilindro2':
										child.renderOrder = 2;
										child.material = this.world.materials.black.clone();
										break;
									default:
										child.renderOrder = 1;
										child.material = this.world.materials.white.clone();
								}
								break;
							case 'intimo-attivo':
								if (child.name === 'corpo') {
									child.material = this.world.materials.intimoAttivo.clone();
								} else {
									child.material = this.world.materials.white.clone();
								}
								break;
							case 'latte-corpo':
								if (child.name === 'corpo') {
									child.material = this.world.materials.latteCorpo.clone();
								} else {
									child.material = this.world.materials.white.clone();
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
			this.update(event.intersection, event.windowRect, world.camera.cameraRect);
		});
	}

	opacity(opacity) {
		this.model.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.material.opacity = child.material.name === 'transparent' ? opacity * 0.4 : opacity;
				child.material.transparent = true;
				child.material.alphaTest = 0.02;
			}
		});
	}

	pow(intersection, offset) {
		let pow = Math.min(0.0, intersection.offset(offset)) + 1;
		pow = Math.max(0.0, pow);
		pow = Ease.Sine.InOut(pow);
		pow -= 1;
		return pow;
	}

	update(intersection, windowRect, cameraRect) {
		const sx = intersection.width / windowRect.width * cameraRect.width;
		const sy = intersection.height / windowRect.height * cameraRect.height;
		const tx = intersection.x * cameraRect.width / windowRect.width - cameraRect.width / 2;
		const ty = intersection.y * cameraRect.height / windowRect.height - cameraRect.height / 2;
		const model = this.model;
		let pow, scale;
		switch (this.key) {
			case 'doccia-schiuma':
				scale = sx / 40;
				model.scale.x = model.scale.y = model.scale.z = scale;
				pow = this.pow(intersection, window.innerHeight * 0.5);
				model.rotation.x = deg(16) * pow;
				model.rotation.y = deg(16) * pow;
				model.rotation.z = deg(25) + deg(10) * pow;
				model.position.x = tx + 2;
				model.position.y = -ty;
				break;
			case 'gel-mousse-doccia':
				scale = sx / 8;
				model.scale.x = model.scale.y = model.scale.z = scale;
				pow = this.pow(intersection, 100);
				model.rotation.y = deg(180) * pow;
				model.rotation.z = deg(5) * pow;
				model.position.x = tx - 5 * (-pow);
				model.position.y = -ty - 2;
				this.opacity(Math.max(0, Math.min(1, pow + 1)));
				break;
			case 'intimo-attivo':
				scale = sx / 8;
				model.scale.x = model.scale.y = model.scale.z = scale;
				pow = Math.min(0.0, intersection.offset(100));
				model.children[1].rotation.z = -deg(15) - deg(180) * pow;
				model.rotation.z = deg(35);
				model.position.x = tx + 5 * (-pow);
				model.position.y = -ty + 2;
				this.opacity(Math.max(0, Math.min(1, pow + 1)));
				break;
			case 'latte-corpo':
				scale = sx / 5.1;
				model.scale.x = model.scale.y = model.scale.z = scale;
				pow = Math.min(0.0, intersection.offset(100));
				model.rotation.y = deg(20) * pow;
				model.rotation.z = deg(10) * pow;
				model.position.x = tx - 3 * (-pow);
				model.position.y = -ty;
				this.opacity(Math.max(0, Math.min(1, pow + 1)));
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
