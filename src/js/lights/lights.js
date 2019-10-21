/* jshint esversion: 6 */

export default class Lights extends THREE.Group {

	constructor(parent) {
		super();
		/*
		this.rotationScroll = new THREE.Vector3();
		this.rotationTime = new THREE.Vector3();
		*/

		const light0 = new THREE.HemisphereLight(0xffffff, 0x5e6770, 1.0);
		light0.position.set(0, 0, 0);
		parent.add(light0);
		return;

		const light1 = new THREE.DirectionalLight(0xffffff, 0.1);
		light1.position.set(20, 20, 20);
		this.add(light1);

		const light2 = new THREE.DirectionalLight(0xffffff, 0.1);
		light2.position.set(-20, 10, 30);
		this.add(light2);

		/*
		this.light0 = light0;
		this.light1 = light1;
		this.light2 = light2;
		*/
		console.log(light0, light1, light2);
		parent.add(this);
	}

	render(time) {
		this.rotation.y = THREE.Math.degToRad(15) * Math.cos(time * 1.1);
	}

}
