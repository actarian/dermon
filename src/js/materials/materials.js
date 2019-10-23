/* jshint esversion: 6 */

const ENV_MAP_INTENSITY = 1.5;

export default class Materials {

	constructor(renderer, callback) {
		this.renderer = renderer;
		const textures = this.textures = this.addTextures();
		const white = this.white = this.getWhite();
		const transparent = this.transparent = this.getTransparent();
		const black = this.black = this.getBlack();
		const docciaSchiuma = this.docciaSchiuma = this.getDocciaSchiuma();
		const gelMousseDoccia = this.gelMousseDoccia = this.getGelMousseDoccia();
		const intimoAttivo = this.intimoAttivo = this.getIntimoAttivo();
		const latteCorpo = this.latteCorpo = this.getLatteCorpo();
		this.getEquirectangular('three/environment/environment-04.jpg', (texture, backgroundTexture) => {
			textures.environment = texture;
			white.envMap = texture;
			white.needsUpdate = true;
			transparent.envMap = texture;
			transparent.needsUpdate = true;
			black.envMap = texture;
			black.needsUpdate = true;
			docciaSchiuma.envMap = texture;
			docciaSchiuma.needsUpdate = true;
			gelMousseDoccia.envMap = texture;
			gelMousseDoccia.needsUpdate = true;
			intimoAttivo.envMap = texture;
			intimoAttivo.needsUpdate = true;
			latteCorpo.envMap = texture;
			latteCorpo.needsUpdate = true;
			if (typeof callback === 'function') {
				callback(this);
			}
		});
	}

	addTextures() {
		const loader = new THREE.TextureLoader();
		const textures = {
			docciaSchiuma: loader.load('three/models/doccia-schiuma/doccia-schiuma.jpg', (texture) => {
				texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
			}),
			gelMousseDoccia: loader.load('three/models/gel-mousse-doccia/gel-mousse-doccia.jpg', (texture) => {
				texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
			}),
			intimoAttivo: loader.load('three/models/intimo-attivo/intimo-attivo.jpg', (texture) => {
				texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
			}),
			latteCorpo: loader.load('three/models/latte-corpo/latte-corpo.jpg', (texture) => {
				texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
			}),
			noise: loader.load('three/noise/noise.png', (texture) => {
				texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
			}),
		};
		this.loader = loader;
		return textures;
	}

	getWhite() {
		let material;
		material = new THREE.MeshStandardMaterial({
			name: 'white',
			color: 0xf4f4f6,
			roughness: 0.45,
			metalness: 0.01,
			envMapIntensity: ENV_MAP_INTENSITY,
			side: THREE.FrontSide,
		});
		return material;
	}

	getTransparent() {
		let material;
		material = new THREE.MeshStandardMaterial({
			name: 'transparent',
			color: 0xaaaaaa,
			roughness: 0.05,
			metalness: 0.05,
			opacity: 0.4,
			transparent: true,
			alphaTest: 0.3,
			envMapIntensity: ENV_MAP_INTENSITY * 2,
			side: THREE.FrontSide,
		});
		return material;
	}

	getBlack() {
		let material;
		material = new THREE.MeshStandardMaterial({
			name: 'black',
			color: 0x222222,
			roughness: 0.05,
			metalness: 0.05,
			envMapIntensity: ENV_MAP_INTENSITY,
			side: THREE.FrontSide,
		});
		return material;
	}

	getDocciaSchiuma() {
		let material;
		material = new THREE.MeshStandardMaterial({
			name: 'docciaSchiuma',
			color: 0xf4f4f6, // 0xefeff8,
			roughness: 0.45,
			metalness: 0.01,
			map: this.textures.docciaSchiuma,
			envMapIntensity: ENV_MAP_INTENSITY,
			side: THREE.FrontSide,
		});
		return material;
	}

	getGelMousseDoccia() {
		let material;
		material = new THREE.MeshStandardMaterial({
			name: 'gelMousseDoccia',
			color: 0xf4f4f6, // 0xefeff8,
			roughness: 0.45,
			metalness: 0.01,
			map: this.textures.gelMousseDoccia,
			envMapIntensity: ENV_MAP_INTENSITY,
			side: THREE.FrontSide,
		});
		return material;
	}

	getIntimoAttivo() {
		let material;
		material = new THREE.MeshStandardMaterial({
			name: 'intimoAttivo',
			color: 0xf4f4f6, // 0xefeff8,
			roughness: 0.45,
			metalness: 0.01,
			map: this.textures.intimoAttivo,
			envMapIntensity: ENV_MAP_INTENSITY,
			side: THREE.FrontSide,
		});
		return material;
	}

	getLatteCorpo() {
		let material;
		material = new THREE.MeshStandardMaterial({
			name: 'latteCorpo',
			color: 0xf4f4f6, // 0xefeff8,
			roughness: 0.45,
			metalness: 0.01,
			map: this.textures.latteCorpo,
			envMapIntensity: ENV_MAP_INTENSITY,
			side: THREE.FrontSide,
		});
		return material;
	}

	getEquirectangular(path, callback) {
		const loader = this.loader;
		const renderer = this.renderer;
		loader.load(path, (texture) => {
			texture.encoding = THREE.sRGBEncoding;
			const generator = new THREE.EquirectangularToCubeGenerator(texture, { resolution: 512 });
			const background = generator.renderTarget;
			const cubeMapTexture = generator.update(renderer);
			const pmremGenerator = new THREE.PMREMGenerator(cubeMapTexture);
			pmremGenerator.update(renderer);
			const pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
			pmremCubeUVPacker.update(renderer);
			const cubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;
			texture.dispose();
			pmremGenerator.dispose();
			pmremCubeUVPacker.dispose();
			if (typeof callback === 'function') {
				callback(cubeRenderTarget.texture, background.texture);
			}
		});
	}

}
