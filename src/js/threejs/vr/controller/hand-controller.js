/* jshint esversion: 6 */

import { mm, TEST_ENABLED } from '../../const';
import { GAMEPAD_HANDS } from '../gamepads';
import Controller from './controller';

export default class HandController extends Controller {

	constructor(parent, gamepad, options = {}) {
		super(parent, gamepad, options);
	}

	addModel(hand) {
		const format = '.fbx';
		const path = `${HandController.FOLDER}/${hand}/${hand}-animated`;
		const matcap = new THREE.TextureLoader().load('threejs/matcap/matcap-06.jpg');
		const material = new THREE.MeshMatcapMaterial({
			color: 0xffffff,
			matcap: matcap,
			alphaTest: 0.1,
			transparent: true,
			opacity: 1,
			skinning: true,
			side: THREE.BackSide,
		});
		/*
		const texture = new THREE.TextureLoader().load(`${path}.jpg`);
		const material = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			// map: texture,
			// matcap: matcap,
			alphaTest: 0.1,
			transparent: true,
			opacity: 1,
			skinning: true,
			side: THREE.DoubleSide,
		});
		*/
		const mesh = new THREE.Group();
		const loader = format === '.fbx' ? new THREE.FBXLoader() : new THREE.OBJLoader();
		let i = 0;
		loader.load(`${path}${format}`, (object) => {
			const mixer = this.mixer = new THREE.AnimationMixer(object);
			mixer.timeScale = 2;
			const grabClip = this.grabClip = mixer.clipAction(object.animations[0]);
			grabClip.setLoop(THREE.LoopOnce);
			grabClip.clampWhenFinished = true;
			const releaseClip = this.releaseClip = mixer.clipAction(object.animations[1]);
			releaseClip.setLoop(THREE.LoopOnce);
			releaseClip.clampWhenFinished = true;
			object.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.material = material;
					// child.material = material.clone();
					// child.geometry.scale(0.1, 0.1, 0.1);
					// child.geometry.computeBoundingBox();
				}
			});
			// object.scale.set(0.1, 0.1, 0.1);
			// const s = hand === GAMEPAD_HANDS.LEFT ? 0.045 : 0.045;
			const s = 1;
			object.scale.set(hand === GAMEPAD_HANDS.LEFT ? -s : s, s, s);
			mesh.add(object);
			this.material = material;
			this.boundingBox.setFromObject(object);
			this.skeleton = new THREE.SkeletonHelper(object);
			this.ready = true;
		}, (xhr) => {
			this.progress = xhr.loaded / xhr.total;
		}, (error) => {
			console.log(error);
			console.log(`HandController.addModel not found ${path}${format}`);
		});
		return mesh;
	}

	addRay(hand) {
		if (TEST_ENABLED) {
			const geometry = new THREE.CylinderBufferGeometry(mm(4), mm(4), 30, 3);
			geometry.rotateX(Math.PI / 2);
			const material = new THREE.MeshBasicMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: 0.5,
			});
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(0, 0, -15);
			return mesh;
		} else {
			const group = new THREE.Group();
			return group;
		}
	}

	press(index) {
		if (index === 2) {
			if (this.releaseClip) {
				this.releaseClip.stop();
			}
			if (this.grabClip) {
				if (this.grabClip.paused) {
					this.grabClip.reset();
				} else {
					this.grabClip.play();
				}
			}
		}
	}

	release(index) {
		if (index === 2) {
			if (this.grabClip) {
				this.grabClip.stop();
			}
			if (this.releaseClip) {
				if (this.releaseClip.paused) {
					this.releaseClip.reset();
				} else {
					this.releaseClip.play();
				}
			}
		}
	}

	update(tick) {
		const clock = this.clock || (this.clock = new THREE.Clock());
		if (this.mixer) {
			const delta = clock.getDelta();
			this.mixer.update(delta);
		}
		/*
		if (this.options.test && this.ready) {
			const time = clock.getElapsedTime();
			if (time > 0 && Math.floor(time) % 5 === 0) {
				if (this.clip.paused) {
					this.clip.play();
					// this.clip.play().reset();
					// console.log(this.clip);
				}
			}
			// this.buttons[1].value = Math.abs(Controller.getCos(tick, 1));
		}
		*/
	}

}

HandController.FOLDER = `threejs/models/hand`;
