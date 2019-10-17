/* jshint esversion: 6 */

import Emittable from "../interactive/emittable";

export default class PhysicsWorker extends Emittable {

	constructor() {
		super();
		this.meshes = {};
		this.data = { action: 'stepSimulation', delta: 0 };
		const worker = this.worker = new Worker('./js/worker.wasm.js');
		const debugInfo = document.querySelector('.debug__info');
		worker.onmessage = (event) => {
			const items = event.data;
			if (items) {
				// debugInfo.innerHTML = items.fps;
				const meshes = this.meshes;
				for (let i = 0; i < items.length; i++) {
					const item = items[i];
					const mesh = meshes[item.id];
					if (mesh && !mesh.freezed) {
						mesh.position.set(item.position.x, item.position.y, item.position.z);
						mesh.quaternion.set(item.quaternion.x, item.quaternion.y, item.quaternion.z, item.quaternion.w);
						if (mesh.userData.respawn) {
							mesh.userData.respawn(item);
						}
						/*
						if (item.isActive) {
							console.log(item);
						}
						*/
					}
				}
			}
			this.emit('items', items);
		};
		this.emit('init');
	}

	update(delta) {
		// noop
		/*
		this.data.delta = delta;
		this.worker.postMessage(this.data);
		*/
	}

	remove(mesh) {
		if (this.meshes[mesh.id]) {
			const data = {
				action: 'remove',
				id: mesh.id,
			};
			delete this.meshes[mesh.id];
			this.worker.postMessage(data);
		}
	}

	addBox(mesh, size, mass, linearVelocity, angularVelocity) {
		const data = {
			action: 'addBox',
			id: mesh.id,
			position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
			quaternion: { x: mesh.quaternion.x, y: mesh.quaternion.y, z: mesh.quaternion.z, w: mesh.quaternion.w },
			size: size,
			mass: mass,
			linearVelocity: linearVelocity,
			angularVelocity: angularVelocity,
		};
		this.worker.postMessage(data);
		this.meshes[mesh.id] = mesh;
	}

	addSphere(mesh, radius, mass, linearVelocity, angularVelocity) {
		const data = {
			action: 'addSphere',
			id: mesh.id,
			position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
			quaternion: { x: mesh.quaternion.x, y: mesh.quaternion.y, z: mesh.quaternion.z, w: mesh.quaternion.w },
			radius: radius,
			mass: mass,
			linearVelocity: linearVelocity,
			angularVelocity: angularVelocity,
		};
		this.worker.postMessage(data);
		this.meshes[mesh.id] = mesh;
	}

}

/*
onmessage = function(event) {
var data = event.data;
if (data.objects.length != NUM) return;
for (var i = 0; i < NUM; i++) {
	var physicsObject = data.objects[i];
	var renderObject = boxes[i];
	renderObject.position[0] = physicsObject[0];
	renderObject.position[1] = physicsObject[1];
	renderObject.position[2] = physicsObject[2];
	quaternion.x = physicsObject[3];
	quaternion.y = physicsObject[4];
	quaternion.z = physicsObject[5];
	quaternion.w = physicsObject[6];
	renderObject.rotation = quaternion.toEuler();
}
currFPS = data.currFPS;
allFPS = data.allFPS;
};

physicsWorker.postMessage(NUM);

}
*/
