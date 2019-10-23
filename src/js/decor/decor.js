/* jshint esversion: 6 */

import { Subject } from 'rxjs';
import Ease from '../ease/ease';
import DomService from '../services/dom.service';

const USE_SHADER_MATERIAL = false;

const vertexShader = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform float uPow;
uniform float uSpeed;

void main() {
	vUv = uv;
	vec3 vPosition = position;
	// vPosition.y += cos(position.x + uTime * 0.001) * (uSpeed * 0.05);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uImage;
uniform float uOpacity;
varying vec2 vUv;
void main() {
	vec4 color = texture2D(uImage, vUv);
	color.a *= uOpacity;
	if (color.a < 0.01) discard;
	gl_FragColor = color;
	gl_FragColor.rgb *= gl_FragColor.a;
}
`;

const deg = THREE.Math.degToRad;

const domService = DomService.get();

export default class Decor {

	constructor(node, world) {
		this.node = node;
		this.world = world;
		this.path = node.getAttribute('decor');
		this.render_ = new Subject();
		this.load((model) => {
			this.set(model);
		});
	}

	getShaderMaterial() {
		const material = new THREE.ShaderMaterial({
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			uniforms: {
				uImage: {
					type: 't',
					value: new THREE.Texture(),
				},
				uOpacity: {
					type: 'f',
					value: 1
				},
				uTime: {
					type: 'f',
					value: performance.now()
				},
				uSpeed: {
					type: 'f',
					value: 0
				},
				uPow: {
					type: 'f',
					value: 0
				},
				uResolution: {
					type: 'v2',
					value: new THREE.Vector2(window.innerWidth, window.innerHeight).multiplyScalar(window.devicePixelRatio)
				},
			},
			side: THREE.FrontSide
		});
		return material;
	}

	getMaterial() {
		const material = new THREE.MeshBasicMaterial({
			name: 'transparent',
			color: 0xffffff,
			transparent: true,
			opacity: 1.0,
			alphaTest: 0.01,
			side: THREE.FrontSide,
		});
		return material;
	}

	load(callback) {
		const material = USE_SHADER_MATERIAL ? this.getShaderMaterial() : this.getMaterial();
		const geometry = new THREE.PlaneGeometry(1, 1, 10, 10);
		const model = new THREE.Mesh(geometry, material);
		material.map = this.world.materials.loader.load(this.path, (texture) => {
			texture.anisotropy = this.world.renderer.capabilities.getMaxAnisotropy();
			// texture.magFilter = THREE.NearestFilter;
			// texture.minFilter = THREE.LinearFilter;
			if (USE_SHADER_MATERIAL) {
				material.uniforms.uImage.value = texture;
			}
			material.needsUpdate = true;
			if (typeof callback === 'function') {
				console.log(this.path);
				callback(model);
			}
		});
		this.set(model);
	}

	set(model) {
		const node = this.node;
		const world = this.world;
		model.userData.render = () => {
			this.render_.next();
		};
		world.scene.add(model);
		this.model = model;
		domService.scrollIntersection$(node).subscribe(event => {
			this.scroll = event.scroll;
			this.intersection = event.intersection;
			this.windowRect = event.windowRect;
			this.cameraRect = world.camera.cameraRect;
		});
		this.render_.subscribe(() => {
			this.update(this.scroll, this.intersection, this.windowRect, this.cameraRect);
		});
	}

	opacity(opacity) {
		this.model.material.opacity = opacity;
	}

	pow(intersection, offset) {
		let pow = Math.min(0.0, intersection.offset(offset)) + 1;
		pow = Math.max(0.0, pow);
		pow = Ease.Sine.InOut(pow);
		pow -= 1;
		return pow;
	}

	update(scroll, intersection, windowRect, cameraRect) {
		const sx = intersection.width / windowRect.width * cameraRect.width;
		const sy = intersection.height / windowRect.height * cameraRect.height;
		const tx = intersection.x * cameraRect.width / windowRect.width - cameraRect.width / 2;
		const ty = intersection.y * cameraRect.height / windowRect.height - cameraRect.height / 2;
		const model = this.model;
		model.scale.x = sx;
		model.scale.y = sy;
		model.scale.z = 1;
		const pow = this.pow(intersection, windowRect.height * 0.75);
		const opacity = Math.max(0, Math.min(1, pow + 1));
		if (USE_SHADER_MATERIAL) {
			model.material.uniforms.uTime.value = performance.now();
			model.material.uniforms.uOpacity.value = opacity;
			model.material.uniforms.uSpeed.value = scroll.speed ? Math.abs(scroll.speed) : 0;
		} else {
			model.material.opacity = opacity;
		}
		if (this.path.indexOf('doccia-schiuma-decor') !== -1) {
			model.position.x = tx;
			model.position.y = -ty;
			model.rotation.z = deg(35);
		}
		if (this.path.indexOf('gel-mousse-doccia-decor') !== -1) {
			model.position.x = tx;
			model.position.y = -ty;
		}
		if (this.path.indexOf('intimo-attivo-decor') !== -1) {
			model.position.x = tx;
			model.position.y = -ty;
			model.rotation.z = deg(10) * pow;
		}
		if (this.path.indexOf('latte-corpo-decor') !== -1) {
			model.position.x = tx;
			model.position.y = -ty;
			model.rotation.z = deg(10) * pow;
		}
	}

}
