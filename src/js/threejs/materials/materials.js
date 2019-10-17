/* jshint esversion: 6 */

export default class Materials {

	constructor(renderer) {
		this.renderer = renderer;
		const textures = this.textures = this.addTextures();
		const white = this.white = this.getWhite();
		const tubetto = this.tubetto = this.getTubetto();
		this.getEquirectangular('threejs/environment/environment-02.jpg', (texture, backgroundTexture) => {
			textures.environment = texture;
			white.envMap = texture;
			white.needsUpdate = true;
			tubetto.envMap = texture;
			tubetto.needsUpdate = true;
		});
	}

	addTextures() {
		const loader = new THREE.TextureLoader();
		const textures = {
			tubetto: loader.load('threejs/models/text.jpg'),
		};
		this.loader = loader;
		return textures;
	}

	getWhite() {
		let material;
		material = new THREE.MeshStandardMaterial({
			name: 'white',
			color: 0xffffff,
			roughness: 0.99,
			metalness: 0.01,
			envMapIntensity: 1.2,
		});
		return material;
	}

	getTubetto() {
		let material;
		material = new THREE.MeshStandardMaterial({
			name: 'tubetto',
			color: 0xffffff,
			roughness: 0.99,
			metalness: 0.01,
			map: this.textures.tubetto,
			envMapIntensity: 1.2,
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
