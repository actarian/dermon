/* jshint esversion: 6 */

// import * as dat from 'dat.gui';
import { cm, DEBUG, deg, mm, TEST_ENABLED, VR_ENABLED } from './const';
import RoundBoxGeometry from './geometries/round-box.geometry';
import Emittable from './interactive/emittable';
import FreezableGroup from './interactive/freezable.group';
import FreezableMesh from './interactive/freezable.mesh';
import GrabbableGroup from './interactive/grabbable.group';
import InteractiveMesh from './interactive/interactive.mesh';
import Materials from './materials/materials';
// import Physics from './physics/physics';
import PhysicsWorker from './physics/physics.worker';
import Controllers from './vr/controllers';
import { GAMEPAD_HANDS } from './vr/gamepads';
import { VR, VR_MODE } from './vr/vr';

const CAMERA_DISTANCE = 2;
const USE_CUBE_CAMERA = false;
const ANTIALIAS_ENABLED = false;
const COMPOSER_ENABLED = true;
const TAA_ENABLED = true;
const MIN_DEVICE_PIXEL_RATIO = 1;

let baseZoom = 1;

export default class Canvas extends Emittable {

	get presenting() {
		return this.presenting_;
	}

	set presenting(presenting) {
		if (this.presenting_ !== presenting) {
			this.presenting_ = presenting;
			this.togglePrensenting(presenting);
		}
	}

	get anchor() {
		return this.anchor_;
	}

	set anchor(anchor) {
		if (this.anchor_ !== anchor) {
			this.anchor_ = anchor;
			this.tweenTau(anchor);
		}
	}

	get bristle() {
		return this.bristle_;
	}

	set bristle(bristle) {
		if (this.bristle_ !== bristle) {
			this.bristle_ = bristle;
			this.setBristle(bristle);
		}
	}

	get color() {
		return this.color_;
	}

	set color(color) {
		console.log('set color', color);
		if (this.color_ !== color) {
			this.color_ = color;
			this.setColor(color);
		}
	}

	get zoom() {
		let r;
		const w = this.container.offsetWidth;
		const h = this.container.offsetHeight;
		const s = Math.max(Math.min(w, h, 1200), 375);
		if (s >= 768) {
			r = s / 1440;
		} else {
			r = s / 640;
		}
		return (this.zoom_ + r * baseZoom);
	}

	constructor(container, product) {
		super();
		this.container = container;
		this.debugInfo = container.querySelector('.debug__info');
		this.product = product;
		this.tick = 0;
		this.clock = new THREE.Clock();
		this.linearVelocity = new THREE.Vector3();
		this.angularVelocity = new THREE.Vector3();
		this.pingpong = 0;
		this.mouse = { x: 0, y: 0 };
		this.size = { width: 0, height: 0, aspect: 0 };
		this.zoom_ = 0;
		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
		this.onWindowResize = this.onWindowResize.bind(this);
		this.onSave = this.onSave.bind(this);
		const scene = this.scene = this.addScene();
		const camera = this.camera = this.addCamera();
		scene.add(camera);
		const renderer = this.renderer = this.addRenderer();
		const materials = this.materials = new Materials(product);
		const lights = this.lights = this.addLights(scene);
		let texture;
		const vr = this.vr = this.addVR();
		// vr.mode = VR_MODE.VR;
		if (!VR_ENABLED || vr.mode === VR_MODE.NONE) {
			const composer = this.composer = this.addComposer();
			// const addons = this.addons = this.addSpheres();
			// scene.add(addons);
			// texture = this.getCubeCamera();
			const toothbrush = this.toothbrush = this.addToothbrush(scene);
			/*
			setTimeout(() => {
				vr.enabled = true;
				setTimeout(() => {
					vr.enabled = false;
				}, 4000);
			}, 4000);
			*/
		} else {
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFShadowMap; // THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
			const raycaster = this.raycaster = new THREE.Raycaster();
			const controllers = this.controllers = this.addControllers(renderer, vr, scene);
			// const physics = this.physics = new Physics();
			const physics = this.physics = new PhysicsWorker();
			this.addSceneBackground(renderer, (texture, source, options) => {
				this.sceneBackground = texture;
			});
			setTimeout(() => {
				const floor = this.floor = this.addFloor();
				const stand = this.stand = this.addStand();
				const toothbrush = this.toothbrush = this.addToothbrush(scene);
				toothbrush.defaultY = this.stand.position.y + cm(50);
			}, 1000);
		}
		const controls = this.controls = this.addControls();
		window.addEventListener('resize', this.onWindowResize, false);
		this.onWindowResize();
	}

	addRenderer() {
		const renderer = new THREE.WebGLRenderer({
			antialias: (('xr' in navigator) || ('getVRDisplays' in navigator)) ? true : ANTIALIAS_ENABLED,
			// localClippingEnabled: true,
			// logarithmicDepthBuffer: true,
			// premultipliedAlpha: true,
			// preserveDrawingBuffer: true, // !!! REMOVE IN PRODUCTION
			alpha: true,
		});
		this.renderer = renderer;
		renderer.setClearColor(0xffffff, 0);
		// renderer.setPixelRatio(window.devicePixelRatio);
		const pixelRatio = this.pixelRatio = Math.max(window.devicePixelRatio, MIN_DEVICE_PIXEL_RATIO);
		renderer.setPixelRatio(pixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
		// container.innerHTML = '';
		this.container.appendChild(renderer.domElement);
		return renderer;
	}

	addVR() {
		if (VR_ENABLED) {
			const vr = new VR(this.renderer, {
				referenceSpaceType: 'local'
			}, this.camera, this.container.parentNode.querySelector('.group--nav--vr'));
			vr.on('presenting', () => {
				this.presenting = true;
			});
			vr.on('exit', () => {
				this.presenting = false;
			});
			vr.on('error', (error) => {
				this.debugInfo.innerHTML = error;
			});
			this.emit('vrmode', vr.mode);
			// this.container.appendChild(vr.element);
			return vr;
		}
	}

	addControllers(renderer, vr, scene) {
		if (vr.mode !== VR_MODE.NONE || TEST_ENABLED) {
			const controllers = new Controllers(renderer, scene, {
				debug: DEBUG
			});
			controllers.on('press', (button) => {
				// console.log('vrui.press', button.gamepad.hand, button.index);
				/*
				switch (button.gamepad.hand) {
					case GAMEPAD_HANDS.LEFT:
						// 0 joystick, 1 trigger, 2 grip, 3 Y, 4 X
						break;
					case GAMEPAD_HANDS.RIGHT:
						// 0 joystick, 1 trigger, 2 grip, 3 A, 4 B
						break;
				}
				*/
				if (button.index === 3) {
					this.toothbrush.onRespawn();
				}
			});
			return controllers;
		}
	}

	togglePrensenting(presenting) {
		console.log('togglePrensenting', presenting);
		const renderer = this.renderer;
		const scene = this.scene;
		const physics = this.physics;
		const lights = this.lights;
		const floor = this.floor;
		const stand = this.stand;
		const toothbrush = this.toothbrush;
		if (presenting) {
			scene.background = this.sceneBackground;
			scene.add(floor);
			physics.addBox(floor, floor.userData.size);
			scene.add(stand);
			physics.addBox(stand, stand.userData.size);
			toothbrush.userData.previousPosition = toothbrush.position.clone();
			toothbrush.userData.previousQuaternion = toothbrush.quaternion.clone();
			toothbrush.quaternion.setFromEuler(this.getEulerFromArray([0, 0, deg(10)]));
			// toothbrush.rotation.set(0, 0, deg(10));
			toothbrush.defaultY = stand.position.y + cm(50);
			toothbrush.position.set(0, toothbrush.defaultY, cm(-60));
			physics.addBox(toothbrush, toothbrush.userData.size, 1);
			lights.remove(lights.light0);
			lights.remove(lights.light1);
			lights.add(lights.light2);
		} else {
			lights.add(lights.light0);
			lights.add(lights.light1);
			lights.remove(lights.light2);
			if (physics) {
				physics.remove(toothbrush);
				physics.remove(stand);
				physics.remove(floor);
			}
			scene.background = null; // this.sceneDefaultBackground;
			renderer.setClearColor(0xffffff, 0);
			scene.remove(floor);
			scene.remove(stand);
			if (toothbrush.userData.previousPosition && toothbrush.userData.previousQuaternion) {
				toothbrush.position.copy(toothbrush.userData.previousPosition);
				toothbrush.quaternion.copy(toothbrush.userData.previousQuaternion);
			}
		}
	}

	addFloor() {
		const size = new THREE.Vector3(40, cm(1), 40);
		const geometry = new THREE.PlaneGeometry(40, 40);
		geometry.rotateX(deg(-90));
		const material = new THREE.ShadowMaterial();
		material.opacity = 0.5;
		const floor = new THREE.Mesh(geometry, material);
		floor.position.y = 0.0;
		floor.userData.size = size;
		floor.receiveShadow = true;
		return floor;
	}

	addStand() {
		const size = new THREE.Vector3(cm(40), mm(10), cm(20));
		const geometry = new RoundBoxGeometry(size.x, size.y, size.z, mm(5), 1, 1, 1, 5);
		const stand = new THREE.Mesh(geometry, this.materials.white);
		stand.position.set(0, cm(116), cm(-60));
		stand.userData.size = size;
		stand.receiveShadow = true;
		return stand;
	}

	updateVelocity(controller) {
		if (controller) {
			this.linearVelocity.copy(controller.linearVelocity).multiplyScalar(40);
			this.angularVelocity.copy(controller.angularVelocity).multiplyScalar(10);
		}
	}

	addScene() {
		// this.sceneDefaultBackground = new THREE.Texture();
		const scene = new THREE.Scene();
		// scene.background = new THREE.Color(0x00000000);
		// scene.background = new THREE.Color(0x404040);
		// scene.fog = new THREE.Fog(scene.background, 10, 700);
		return scene;
	}

	addSceneBackground(renderer, callback) {
		const loader = new THREE.TextureLoader().load('threejs/environment/equirectangular.jpg', (source, textureData) => {
			source.mapping = THREE.UVMapping;
			const options = {
				resolution: 1024,
				generateMipmaps: true,
				minFilter: THREE.LinearMipMapLinearFilter,
				magFilter: THREE.LinearFilter
			};
			const texture = new THREE.CubemapGenerator(renderer).fromEquirectangular(source, options);
			if (typeof callback === 'function') {
				callback(texture, source, options);
				source.dispose();
			}
		});
		return loader;
	}

	equirectangularToCubeMap(texture, source, options) {
		const cubemapGenerator = new THREE.EquirectangularToCubeGenerator(source, options);
		const cubemap = cubemapGenerator.update(renderer);
		cubemap.mapping = THREE.CubeReflectionMapping;
		cubemap.mapping = THREE.CubeRefractionMapping;
		return cubemap;
	}

	addCamera() {
		baseZoom = 1;
		const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.01, 2000);
		camera.position.set(0, 0, CAMERA_DISTANCE);
		camera.target = new THREE.Vector3();
		camera.zoom = this.zoom;
		return camera;
	}

	addVRCamera() {
		const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, cm(1), 500);
		camera.position.set(0, cm(176), cm(20));
		camera.target = new THREE.Vector3(0, cm(156), -cm(60));
		return camera;
	}

	addControls() {
		const camera = this.camera;
		const target = document.querySelector('.orbit-control');
		target.addEventListener('touchstart', this.onTouchStart, false);
		target.addEventListener('touchend', this.onTouchEnd, false);
		target.addEventListener('mousedown', this.onTouchStart, false);
		target.addEventListener('mouseup', this.onTouchEnd, false);
		const controls = new THREE.OrbitControls(camera, target);
		controls.enablePan = false;
		controls.enableZoom = false;
		// controls.enableDamping = true;
		controls.maxDistance = CAMERA_DISTANCE * 3;
		controls.minDistance = CAMERA_DISTANCE * 0.25;
		controls.update();
		return controls;
	}

	addComposer() {
		if (COMPOSER_ENABLED) {
			const renderer = this.renderer;
			const scene = this.scene;
			const camera = this.camera;
			const composer = new THREE.EffectComposer(renderer);
			if (TAA_ENABLED) {
				const taaRenderPass = new THREE.TAARenderPass(scene, camera);
				taaRenderPass.sampleLevel = 2;
				taaRenderPass.unbiased = true;
				composer.addPass(taaRenderPass);
			} else {
				const renderPass = new THREE.RenderPass(scene, camera);
				composer.addPass(renderPass);
			}
			const shaderPass = new THREE.ShaderPass(THREE.ShadowShader);
			composer.addPass(shaderPass);
			return composer;
		}
	}

	addLights(parent) {
		const lights = new THREE.Group();
		const light0 = new THREE.HemisphereLight(0xffffff, 0x666666, 0.6);
		light0.position.set(0, 2, 0);
		lights.light0 = light0;
		lights.add(light0);
		const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
		light1.position.set(0, 0, 4);
		lights.light1 = light1;
		lights.add(light1);
		const light2 = new THREE.DirectionalLight(0xffffff, 1, 100);
		light2.position.set(0, 3, 0);
		light2.castShadow = true;
		parent.add(light2);
		light2.shadow.mapSize.width = 1024;
		light2.shadow.mapSize.height = 1024;
		light2.shadow.radius = 1.25;
		light2.shadow.camera.near = 0.1;
		light2.shadow.camera.far = 100;
		lights.light2 = light2;
		// lights.add(light2);
		parent.add(lights);
		return lights;
	}

	addToothbrush(parent) {
		const toothbrush = new GrabbableGroup();
		const loader = new THREE.FBXLoader();
		loader.load(this.product.model, (object) => {
				object.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						switch (child.name) {
							case 'body-primary':
							case 'bubble':
								child.material = this.materials.bodyPrimaryClear;
								child.castShadow = true;
								toothbrush.body = child;
								break;
							case 'body-secondary':
								child.material = this.materials.bodySecondary;
								child.castShadow = true;
								toothbrush.color = child;
								break;
							case 'bristles-primary':
								child.material = this.materials.bristlesPrimary;
								break;
							case 'bristles-secondary':
								child.material = this.materials.bristlesSecondary;
								break;
							case 'logo':
								child.material = this.materials.logoSilver;
								toothbrush.logo = child;
								child.renderOrder = 2;
								break;
						}
					}
				});
				toothbrush.add(object);
				if (this.physics) {
					const box = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
					box.setFromObject(object);
					const size = box.getSize(new THREE.Vector3());
					toothbrush.userData.size = size;
				}
				this.setBristle(this.bristle);
				this.setColor(this.color);
				this.emit('load');
			},
			(xhr) => {
				// console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},
			(error) => {
				console.log('An error happened', error);
			}
		);
		toothbrush.quaternion.setFromEuler(this.getEulerFromArray([0, deg(-60), deg(-60)])); // tre quarti sinistra
		// toothbrush.rotation.set(0, deg(-60), deg(-60)); // 		tre quarti sinistra
		toothbrush.on('grab', (controller) => {
			console.log('toothbrush.on.grab');
			if (this.physics) {
				this.physics.remove(toothbrush);
			}
			toothbrush.userData.speed = 0;
			toothbrush.freeze();
			const target = controller.parent;
			const position = toothbrush.position.clone();
			toothbrush.parent.localToWorld(position);
			target.worldToLocal(position);
			toothbrush.parent.remove(toothbrush);
			if (controller.gamepad.hand === GAMEPAD_HANDS.LEFT) {
				// toothbrush.rotation.set(deg(180), deg(0), deg(115));
				toothbrush.quaternion.setFromEuler(this.getEulerFromArray([deg(180), deg(0), deg(115)]));
				toothbrush.position.set(cm(1), cm(2), cm(0));
			} else {
				// toothbrush.rotation.set(0, deg(10), deg(-60));
				toothbrush.quaternion.setFromEuler(this.getEulerFromArray([0, deg(10), deg(-60)]));
				toothbrush.position.set(cm(-1), cm(3), cm(-1));
			}
			target.add(toothbrush);
			TweenMax.to(controller.material, 0.4, {
				opacity: 0.0,
				ease: Power2.easeInOut,
			});
		});
		toothbrush.on('release', (controller) => {
			console.log('toothbrush.on.release');
			const target = this.scene;
			const position = toothbrush.position.clone(); // new THREE.Vector3();
			const quaternion = toothbrush.parent.quaternion.clone();
			toothbrush.parent.localToWorld(position);
			target.worldToLocal(position);
			toothbrush.parent.remove(toothbrush);
			toothbrush.position.set(0, 0, 0);
			toothbrush.quaternion.premultiply(quaternion);
			toothbrush.position.set(position.x, position.y, position.z);
			target.add(toothbrush);
			toothbrush.unfreeze();
			TweenMax.to(controller.material, 0.4, {
				opacity: 1.0,
				ease: Power2.easeInOut
			});
			if (this.physics) {
				if (TEST_ENABLED) {
					this.linearVelocity.z -= 1;
				}
				this.physics.addBox(toothbrush, toothbrush.userData.size, 1, this.linearVelocity, this.angularVelocity);
			}
		});
		toothbrush.onRespawn = () => {
			console.log('toothbrush.onRespawn');
			if (this.physics) {
				this.physics.remove(toothbrush);
			}
			toothbrush.parent.remove(toothbrush);
			setTimeout(() => {
				// toothbrush.rotation.set(0, 0, deg(10));
				toothbrush.quaternion.setFromEuler(this.getEulerFromArray([0, 0, deg(10)]));
				toothbrush.position.set(0, toothbrush.defaultY, cm(-60));
				this.scene.add(toothbrush);
				if (this.physics) {
					this.physics.addBox(toothbrush, toothbrush.userData.size, 1);
				}
			}, 1000);
		};
		toothbrush.userData.respawn = (data) => {
			if (toothbrush.position.y < cm(30)) {
				if (data && data.speed < 0.03) {
					toothbrush.onRespawn();
				}
			}
		};
		parent.add(toothbrush);
		return toothbrush;
	}

	tweenTau(anchor) {
		// [Math.PI / 4, Math.PI - Math.PI / 4, Math.PI / 4]; // 		tre quarti sinistra
		// [0, Math.PI, Math.PI / 2]; // 								vertical right;
		// [0, -Math.PI / 2, Math.PI / 32]; // 							testina vista dietro
		// [0, Math.PI - Math.PI / 4, Math.PI / 2]; // 					vertical right tre quarti;
		// [0, 0, Math.PI / 2]; // 										vertical left;
		// [0, 0, 0]; // 												horizontal right
		// [Math.PI / 4, Math.PI / 4, Math.PI / 4]; // 					tre quarti destra
		// [Math.PI / 2, 0, 0]; // 										top right
		const sm = this.container.offsetWidth < 768;
		let rotation, position;
		switch (anchor) {
			case 'hero':
				position = [0, 0, 0];
				rotation = [0, deg(-60), deg(-60)]; // 		tre quarti sinistra
				this.zoom_ = 0;
				this.container.classList.remove('lefted');
				this.container.parentNode.classList.remove('interactive');
				break;
			case 'manico':
				position = [0, 0, 0];
				rotation = [0, 0, deg(-90)]; // 								vertical right;
				this.zoom_ = 0;
				this.container.parentNode.classList.remove('interactive');
				break;
			case 'testina':
				position = [0, cm(-8), 0];
				rotation = [0, deg(-90), deg(-90)]; // 										vertical left;
				this.zoom_ = 0.2;
				this.container.parentNode.classList.remove('interactive');
				break;
			case 'setole':
				position = [0, cm(-12), 0];
				rotation = [0, deg(-30), deg(-90)]; // 								vertical right tre quarti;
				this.zoom_ = 0.4;
				this.container.parentNode.classList.remove('interactive');
				break;
			case 'scalare':
				position = [0, cm(-12), 0];
				rotation = [0, 0, deg(-90)]; // 								vertical right;
				this.zoom_ = 0.4;
				this.container.parentNode.classList.remove('interactive');
				break;
			case 'italy':
				position = [0, 0, 0];
				rotation = [0, deg(-60), deg(-60)]; // 							tre quarti sinistra
				this.zoom_ = 0;
				this.container.parentNode.classList.remove('interactive');
				break;
			case 'setole-tynex':
				position = [0, 0, 0];
				rotation = [0, deg(90), deg(10)]; // 							testina vista dietro
				this.zoom_ = sm ? 0.6 : 0.2;
				this.container.parentNode.classList.remove('interactive');
				break;
			case 'colors':
				position = [0, 0, 0];
				rotation = [0, 0, 0];
				this.zoom_ = sm ? -0.2 : 0;
				this.container.parentNode.classList.add('interactive');
				break;
			default:
				position = [0, 0, 0];
				rotation = [0, deg(-60), deg(-60)]; // 		tre quarti sinistra
				this.zoom_ = 0;
				this.container.parentNode.classList.remove('interactive');
		}
		const toothbrush = this.toothbrush;
		const quaternion = this.getQuaternionFromArray(rotation);
		if (toothbrush) {
			TweenMax.to(toothbrush.position, 0.8, {
				x: position[0],
				y: position[1],
				z: position[2],
				ease: Power2.easeInOut,
			});
			/*
			TweenMax.to(toothbrush.rotation, 1.2, {
				x: rotation[0],
				y: rotation[1],
				z: rotation[2],
				ease: Power2.easeInOut,
			});
			*/
			TweenMax.to(toothbrush.quaternion, 1.2, {
				x: quaternion.x,
				y: quaternion.y,
				z: quaternion.z,
				w: quaternion.w,
				ease: Power2.easeInOut,
			});
			TweenMax.to(this.camera, 0.6, {
				zoom: this.zoom,
				ease: Power2.easeInOut,
				onUpdate: () => {
					this.camera.updateProjectionMatrix();
				}
			});
		}
		if (this.controls && this.camera.position.x !== 0) {
			TweenMax.to(this.camera.position, 0.6, {
				x: 0,
				y: 0,
				z: CAMERA_DISTANCE,
				ease: Power2.easeInOut,
				onUpdate: () => {
					this.controls.update();
					this.camera.updateProjectionMatrix();
				}
			});
		}
	}

	getQuaternionFromEuler(euler) {
		return new THREE.Quaternion().setFromEuler(euler);
	}

	getEulerFromArray(array, axis = 'XYZ') {
		return new THREE.Euler(array[0], array[1], array[2], axis);
	}

	getQuaternionFromArray(array, axis = 'XYZ') {
		return this.getQuaternionFromEuler(this.getEulerFromArray(array, axis));
	}

	tweenColor(material, colorValue) {
		const from = new THREE.Color(material.color.getHex());
		const to = new THREE.Color(colorValue);
		TweenLite.to(from, 0.4, {
			r: to.r,
			g: to.g,
			b: to.b,
			ease: Power2.easeInOut,
			onUpdate: function() {
				material.color = from;
			}
		});
	}

	setBristle(bristle) {
		if (bristle) {
			// console.log('setBristle', bristle);
			const toothbrush = this.toothbrush;
			if (toothbrush.children.length) {
				const object = toothbrush.children[0];
				object.traverse((child) => {
					switch (child.name) {
						case 'body-secondary':
						case 'body-primary':
							break;
						case 'bristles-primary':
							this.tweenColor(child.material, bristle.colors[0]);
							break;
						case 'bristles-secondary':
							this.tweenColor(child.material, bristle.colors[1]);
							break;
						case 'logo':
							break;
					}
				});
			}
		}
	}

	setColor(color) {
		if (color) {
			// console.log('setColor', color);
			const toothbrush = this.toothbrush;
			if (toothbrush.children.length) {
				const object = toothbrush.children[0];
				object.traverse((child) => {
					// console.log(child);
					switch (child.name) {
						case 'body-secondary':
							this.tweenColor(child.material, color.colors[0]);
							// console.log(child.material, color.colors[0]);
							break;
						case 'body-primary':
						case 'bristles-primary':
						case 'bristles-secondary':
						case 'logo':
							break;
					}
				});
			}
		}
	}

	getCubeCamera() {
		if (USE_CUBE_CAMERA) {
			const cubeCamera0 = this.cubeCamera0 = new THREE.CubeCamera(0.01, 1000, 512);
			cubeCamera0.renderTarget.texture.mapping = THREE.CubeRefractionMapping;
			// cubeCamera0.renderTarget.texture.mapping = THREE.CubeUVRefractionMapping;
			// cubeCamera0.renderTarget.texture.mapping = THREE.EquirectangularRefractionMapping;
			cubeCamera0.renderTarget.texture.generateMipmaps = true;
			cubeCamera0.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
			this.scene.add(cubeCamera0);
			const cubeCamera1 = this.cubeCamera1 = new THREE.CubeCamera(0.01, 1000, 512);
			cubeCamera1.renderTarget.texture.mapping = THREE.CubeRefractionMapping;
			// cubeCamera1.renderTarget.texture.mapping = THREE.CubeUVRefractionMapping;
			// cubeCamera1.renderTarget.texture.mapping = THREE.EquirectangularRefractionMapping;
			cubeCamera1.renderTarget.texture.generateMipmaps = true;
			cubeCamera1.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
			this.scene.add(cubeCamera1);
			return this.cubeCamera1.renderTarget.texture;
		}
	}

	addSpheres() {
		const group = new THREE.Group();
		group.visible = false;
		const icosahedron = new THREE.IcosahedronGeometry(200, 1);
		const geometry = new THREE.Geometry();
		icosahedron.vertices.forEach((v, i) => {
			const sphereGeometry = new THREE.IcosahedronGeometry(50, 1);
			sphereGeometry.translate(v.x, v.y, v.z);
			geometry.merge(sphereGeometry);
			sphereGeometry.dispose();
		});
		icosahedron.dispose();
		const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
		const bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);
		geometry.dispose();
		const spheres_ = new THREE.Mesh(bufferGeometry, material);
		group.add(spheres_);
		group.rotation.set(0.3, 0, 0);
		return group;
	}

	updateCubeCamera() {
		if (USE_CUBE_CAMERA && this.cubeCamera0 && this.toothbrush && this.toothbrush.body) {
			const renderer = this.renderer;
			const scene = this.scene;
			// pingpong
			const pingpong = this.pingpong,
				cubeCamera0 = this.cubeCamera0,
				cubeCamera1 = this.cubeCamera1;
			renderer.setClearColor(0xfefefe, 1);
			this.toothbrush.body.visible = false;
			this.toothbrush.logo.visible = false;
			this.toothbrush.color.visible = false;
			this.addons.visible = true;
			// renderer.shadowMap.enabled = false;
			if (pingpong % 2 === 0) {
				this.materials.bodyPrimaryClear.envMap = cubeCamera0.renderTarget.texture;
				// this.materials.logoSilver.envMap = cubeCamera0.renderTarget.texture;
				// this.materials.bodySecondary.envMap = cubeCamera0.renderTarget.texture;
				cubeCamera1.update(renderer, scene);
			} else {
				this.materials.bodyPrimaryClear.envMap = cubeCamera1.renderTarget.texture;
				// this.materials.logoSilver.envMap = cubeCamera1.renderTarget.texture;
				// this.materials.bodySecondary.envMap = cubeCamera1.renderTarget.texture;
				cubeCamera0.update(renderer, scene);
			}
			this.pingpong = pingpong + 1;
			this.toothbrush.body.visible = true;
			this.toothbrush.logo.visible = true;
			this.toothbrush.color.visible = true;
			this.addons.visible = false;
			/*
			this.addons.rotation.set(
				this.addons.rotation.x + 0.01,
				this.addons.rotation.y + 0.02,
				this.addons.rotation.z + 0.03
			);
			*/
			// renderer.shadowMap.enabled = true;
			renderer.setClearColor(0xffffff, 0);
		}
	}

	// events

	onWindowResize() {
		try {
			const container = this.container,
				renderer = this.renderer,
				camera = this.camera,
				composer = this.composer;
			const size = this.size;
			size.width = container.offsetWidth;
			size.height = container.offsetHeight;
			const w = size.width;
			const h = size.height;
			size.aspect = w / h;
			if (renderer) {
				renderer.setSize(w, h);
			}
			if (camera) {
				camera.aspect = w / h;
				camera.zoom = this.zoom;
				camera.updateProjectionMatrix();
			}
			if (composer) {
				composer.setSize(w * this.pixelRatio, h * this.pixelRatio);
			}
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	onTouchStart() {
		if (this.container.parentNode.classList.contains('interactive')) {
			const sm = this.container.offsetWidth < 768;
			this.zoom_ = sm ? 0.6 : 0.2;
			TweenMax.to(this.camera, 0.6, {
				zoom: this.zoom,
				ease: Power2.easeInOut,
				onUpdate: () => {
					this.camera.updateProjectionMatrix();
				}
			});
		}
	}

	onTouchEnd() {
		if (this.container.parentNode.classList.contains('interactive')) {
			const sm = this.container.offsetWidth < 768;
			this.zoom_ = sm ? -0.2 : 0;
			TweenMax.to(this.camera, 0.6, {
				zoom: this.zoom,
				ease: Power2.easeInOut,
				onUpdate: () => {
					this.camera.updateProjectionMatrix();
				}
			});
		}
	}

	updateControls() {
		const controls = this.controls;
		if (controls && !this.presenting) {
			controls.update();
		}
	}

	updateComposer() {
		const composer = this.composer;
		if (composer) {
			composer.render();
		}
	}

	updateRaycaster() {
		try {
			const controllers = this.controllers;
			const raycaster = controllers.setRaycaster(this.raycaster);
			if (raycaster) {
				const hit = InteractiveMesh.hittest(raycaster, controllers.gamepads.button, controllers.controller);
				if (hit) {
					controllers.feedback();
				}
				GrabbableGroup.grabtest(controllers);
			}
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	render(delta) {
		try {
			const renderer = this.renderer;
			const scene = this.scene;
			const delta = this.clock.getDelta();
			const time = this.clock.getElapsedTime();
			const tick = Math.floor(time * 60);
			const camera = this.camera;
			// if (!this.saving) {
			if (this.presenting) {
				if (this.physics) {
					this.physics.update(delta);
				}
				FreezableMesh.update(renderer, scene, camera, delta, time, tick);
				FreezableGroup.update(renderer, scene, camera, delta, time, tick);
				if (this.controllers) {
					this.controllers.update();
					this.updateRaycaster();
					// this.checkCameraPosition__();
					if (this.physics) {
						this.updateVelocity(this.controllers.controller);
					}
				}
				renderer.render(scene, camera);
			} else {
				this.updateControls();
				// this.updateCubeCamera();
				renderer.render(scene, camera);
				this.updateComposer();
			}
			this.delta = delta;
			this.time = time;
			this.tick = tick;
			// }
			// this.checkForScreenshot(renderer);
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}

	}

	animate() {
		const renderer = this.renderer;
		renderer.setAnimationLoop(() => {
			this.render();
		});
	}

	checkForScreenshot(renderer) {
		if (this.save) {
			this.save = false;
			this.saving = true;
			// renderer.preserveDrawingBuffer = true;
			const dataUrl = renderer.domElement.toDataURL('image/png', 0.92);
			// console.log('dataUrl', dataUrl);
			this.saveImage(dataUrl);
			// renderer.preserveDrawingBuffer = false;
			this.saving = false;
			/*
			this.dataUrlToImage(dataUrl).then((image) => {
				this.saveImage(image);
				// renderer.preserveDrawingBuffer = false;
				this.saving = false;
			}, (error) => {
				console.log(error);
				// renderer.preserveDrawingBuffer = false;
				this.saving = false;
            });
            */
		}
	}

	dataUrlToImage(URL) {
		return new Promise(function(resolve, reject) {
			if (!URL) {
				return reject();
			}
			const image = new Image();
			image.onload = () => {
				resolve(image);
			};
			image.onerror = (error) => {
				reject(error);
			};
			image.src = URL;
		});
	}

	saveImage(image, filename = 'snapshot.png') {
		// console.log('saveImage', image);
		if (!image) {
			console.error('Console.save: No picture');
			return;
		}
		// const blob = image; // new Blob(image, { type: 'image/png' });
		const event = document.createEvent('MouseEvents');
		const anchor = document.createElement('a');
		anchor.download = filename;
		anchor.href = image; // window.URL.createObjectURL(blob);
		// anchor.dataset.downloadurl = ['image/png', anchor.download, anchor.href].join(':');
		event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		anchor.dispatchEvent(event);
	}

	saveData(data, filename = 'console.json') {
		if (!data) {
			console.error('Console.save: No data');
			return;
		}
		if (typeof data === 'object') {
			data = JSON.stringify(data, undefined, 4);
		}
		const blob = new Blob([data], { type: 'text/json' });
		const event = document.createEvent('MouseEvents');
		const anchor = document.createElement('a');
		anchor.download = filename;
		anchor.href = window.URL.createObjectURL(blob);
		anchor.dataset.downloadurl = ['text/json', anchor.download, anchor.href].join(':');
		event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		anchor.dispatchEvent(event);
	}

	onSave(event) {
		this.save = true;
	}

	addGUI__() {
		const gui = new dat.GUI();
		const keys = ['bristlesSecondary', 'bristlesPrimary', 'bodySecondary', 'logoSilver', 'bodyPrimaryClear'];
		const properties = {};
		const onChange = (...rest) => {
			// console.log(rest);
			keys.forEach(key => {
				const m = properties[key];
				const material = this[key];
				material.color.setHex(m.color);
				if (key === 'bodyPrimaryClear') {
					material.refractionRatio = m.refractionRatio;
					material.reflectivity = m.reflectivity;
					material.opacity = m.opacity;
				} else {
					material.roughness = m.roughness;
					material.metalness = m.metalness;
				}
			});
			this.camera.zoom = properties.zoom;
			this.camera.updateProjectionMatrix();
		};
		properties.zoom = this.camera.zoom;
		const folders = keys.map(key => {
			const m = properties[key] = {};
			const material = this[key];
			m.color = material.color.getHex();
			const folder = gui.addFolder(key);
			folder.addColor(m, 'color').onFinishChange(onChange);
			if (key === 'bodyPrimaryClear') {
				m.refractionRatio = material.refractionRatio;
				m.reflectivity = material.reflectivity;
				m.opacity = material.opacity;
				folder.add(m, 'refractionRatio', 0.0, 1.0, 0.01).onFinishChange(onChange);
				folder.add(m, 'reflectivity', 0.0, 1.0, 0.01).onFinishChange(onChange);
				folder.add(m, 'opacity', 0.0, 1.0, 0.01).onFinishChange(onChange);
			} else {
				m.roughness = material.roughness;
				m.metalness = material.metalness;
				folder.add(m, 'roughness', 0.0, 1.0, 0.01).onFinishChange(onChange);
				folder.add(m, 'metalness', 0.0, 1.0, 0.01).onFinishChange(onChange);
			}
			return folder;
		});
		gui.add(properties, 'zoom', 0.1, 1.0, 0.01).onFinishChange(onChange);
		const callback = {
			snapshot: this.onSave,
		};
		gui.add(callback, 'snapshot');
		gui.close();
		// dat.GUI.toggleHide();
		return gui;
	}

}

THREE.ShadowShader = {
	uniforms: {
		tDiffuse: {
			value: null
		},
		amount: {
			value: 1.0
		}
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	`,
	fragmentShader: `
		uniform float amount;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		const int blurSize = 5;
		const int horizontalPass = 1;	// 0 or 1 to indicate vertical or horizontal pass
		const float sigma = 5.0;		// The sigma value for the gaussian function: higher value means more blur
										// A good value for 9x9 is around 3 to 5
										// A good value for 7x7 is around 2.5 to 4
										// A good value for 5x5 is around 2 to 3.5
										// ... play around with this based on what you need :)
		const vec2 texOffset = vec2(0.001, 0.001);
		const float PI = 3.14159265;

		const float MAX_ITERATIONS = 100.0;

		vec4 gaussian(sampler2D texture, vec2 p) {
  			float numBlurPixelsPerSide = float(blurSize / 2);
  			// Incremental Gaussian Coefficent Calculation (See GPU Gems 3 pp. 877 - 889)
  			vec3 incrementalGaussian;
  			incrementalGaussian.x = 1.0 / (sqrt(2.0 * PI) * sigma);
  			incrementalGaussian.y = exp(-0.5 / (sigma * sigma));
  			incrementalGaussian.z = incrementalGaussian.y * incrementalGaussian.y;

  			vec4 avgValue = vec4(0.0, 0.0, 0.0, 0.0);
  			float coefficientSum = 0.0;

  			// Take the central sample first...
  			avgValue += texture2D(texture, p) * incrementalGaussian.x;
  			coefficientSum += incrementalGaussian.x;
  			incrementalGaussian.xy *= incrementalGaussian.yz;

			// Go through the remaining 8 vertical samples (4 on each side of the center)
  			for (float i = 1.0; i <= MAX_ITERATIONS; i+= 1.0) {
				if (i >= numBlurPixelsPerSide) {
					break;
				}
    			avgValue += texture2D(texture, p - i * texOffset) * incrementalGaussian.x;
    			avgValue += texture2D(texture, p + i * texOffset) * incrementalGaussian.x;
    			coefficientSum += 2.0 * incrementalGaussian.x;
    			incrementalGaussian.xy *= incrementalGaussian.yz;
  			}

			return avgValue / coefficientSum;
		}

		void main() {
			vec4 color = texture2D(tDiffuse, vUv);

			vec4 shadow = gaussian(tDiffuse, vec2(vUv.x - 0.005, vUv.y + 0.01));
			// vec4 shadow = texture2D(tDiffuse, vec2(vUv.x - 0.005, vUv.y + 0.01));
			shadow.r = shadow.g = shadow.b = 0.0;
			shadow.a *= 0.15;

			vec3 rgb = color.rgb + shadow.rgb;
			float alpha = min(1.0, max(color.a, shadow.a));
			gl_FragColor = vec4(rgb, alpha);
		}
	`
};
