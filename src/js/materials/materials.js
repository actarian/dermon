/* jshint esversion: 6 */

const ENV_MAP_INTENSITY = 1.5;

export default class Materials {

	constructor(renderer) {
		this.renderer = renderer;
		const textures = this.textures = this.addTextures();
		const white = this.white = this.getWhite();
		const docciaSchiuma = this.docciaSchiuma = this.getDocciaSchiuma();
		const latteCorpo = this.latteCorpo = this.getLatteCorpo();
		this.getEquirectangular('three/environment/environment-04.jpg', (texture, backgroundTexture) => {
			textures.environment = texture;
			white.envMap = texture;
			white.needsUpdate = true;
			docciaSchiuma.envMap = texture;
			docciaSchiuma.needsUpdate = true;
			latteCorpo.envMap = texture;
			latteCorpo.needsUpdate = true;
		});
	}

	addTextures() {
		const loader = new THREE.TextureLoader();
		const textures = {
			docciaSchiuma: loader.load('three/models/doccia-schiuma/doccia-schiuma.jpg', (texture) => {
				texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
			}),
			latteCorpo: loader.load('three/models/latte-corpo/latte-corpo.jpg', (texture) => {
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
