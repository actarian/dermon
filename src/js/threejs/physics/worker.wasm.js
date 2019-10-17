/* jshint esversion: 6 */

const Module = { TOTAL_MEMORY: 256 * 1024 * 1024 };

importScripts('./ammo.js');

Ammo().then((Ammo) => {

	const MARGIN = 0.001;
	const ITEMS = [];
	const BODIES = {};

	// Bullet-interfacing code
	const configuration = new Ammo.btDefaultCollisionConfiguration();
	const dispatcher = new Ammo.btCollisionDispatcher(configuration);
	const cache = new Ammo.btDbvtBroadphase();
	const solver = new Ammo.btSequentialImpulseConstraintSolver();
	const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, cache, solver, configuration);
	world.setGravity(new Ammo.btVector3(0, -1, 0));

	function remove(data) {
		let body;
		const item = ITEMS.find(x => x.id === data.id);
		const index = ITEMS.indexOf(item);
		if (index !== -1) {
			ITEMS.splice(index, 1);
			const body = BODIES[item.sx];
			if (body) {
				world.removeRigidBody(body);
				delete BODIES[item.sx];
			}
		}
		return body;
	}

	function addBox(data) {
		const mass = data.mass || 0;
		const size = data.size || { x: 1, y: 1, z: 1 };
		const position = data.position || { x: 0, y: 0, z: 0 };
		const quaternion = data.quaternion || { x: 0, y: 0, z: 0, w: 0 };
		const linearVelocity = data.linearVelocity;
		const angularVelocity = data.angularVelocity;
		const transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
		transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
		const state = new Ammo.btDefaultMotionState(transform);
		const shape = new Ammo.btBoxShape(new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5));
		// const shape = new Ammo.btSphereShape(radius);
		shape.setMargin(MARGIN);
		const inertia = new Ammo.btVector3(0, 0, 0);
		shape.calculateLocalInertia(mass, inertia);
		const info = new Ammo.btRigidBodyConstructionInfo(mass, state, shape, inertia);
		const body = new Ammo.btRigidBody(info);
		if (linearVelocity) {
			body.setLinearVelocity(new Ammo.btVector3(linearVelocity.x, linearVelocity.y, linearVelocity.z));
		}
		if (angularVelocity) {
			body.setAngularVelocity(new Ammo.btVector3(angularVelocity.x, angularVelocity.y, angularVelocity.z));
		}
		world.addRigidBody(body);
		data.sx = body.sx;
		if (mass > 0) {
			// dynamic body
			ITEMS.push(data);
			BODIES[body.sx] = body;
		}
		return body;
	}

	function addSphere(data) {
		const mass = data.mass || 0;
		const radius = data.radius || 1;
		const position = data.position || { x: 0, y: 0, z: 0 };
		const quaternion = data.quaternion || { x: 0, y: 0, z: 0, w: 0 };
		const linearVelocity = data.linearVelocity;
		const angularVelocity = data.angularVelocity;
		const transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
		transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
		const state = new Ammo.btDefaultMotionState(transform);
		const shape = new Ammo.btSphereShape(radius);
		shape.setMargin(MARGIN);
		const inertia = new Ammo.btVector3(0, 0, 0);
		shape.calculateLocalInertia(mass, inertia);
		const info = new Ammo.btRigidBodyConstructionInfo(mass, state, shape, inertia);
		const body = new Ammo.btRigidBody(info);
		if (linearVelocity) {
			body.setLinearVelocity(new Ammo.btVector3(linearVelocity.x, linearVelocity.y, linearVelocity.z));
		}
		if (angularVelocity) {
			body.setAngularVelocity(new Ammo.btVector3(angularVelocity.x, angularVelocity.y, angularVelocity.z));
		}
		world.addRigidBody(body);
		data.sx = body.sx;
		if (mass > 0) {
			// dynamic body
			ITEMS.push(data);
			BODIES[body.sx] = body;
		}
		return body;
	}

	function parseActions(event) {
		let body;
		const data = event.data;
		switch (data.action) {
			case 'stepSimulation':
				stepSimulation(data.delta);
				break;
			case 'remove':
				body = remove(data);
				break;
			case 'addBox':
				body = addBox(data);
				break;
			case 'addSphere':
				body = addSphere(data);
				break;
		}
	}

	onmessage = parseActions;

	const transform = new Ammo.btTransform(); // taking this out of readBulletObject reduces the leaking
	let i, active;

	function stepSimulation(delta) {
		if (!delta) {
			return;
		}
		world.stepSimulation(delta, 1);
		active = false;
		for (i = 0; i < ITEMS.length; i++) {
			const item = ITEMS[i];
			const body = BODIES[item.sx];
			if (body.isActive()) {
				body.getMotionState().getWorldTransform(transform);
				const origin = transform.getOrigin();
				item.position.x = origin.x();
				item.position.y = origin.y();
				item.position.z = origin.z();
				const rotation = transform.getRotation();
				item.quaternion.x = rotation.x();
				item.quaternion.y = rotation.y();
				item.quaternion.z = rotation.z();
				item.quaternion.w = rotation.w();
				// item.isActive = body.isActive();
				const velocity = body.getLinearVelocity();
				item.speed = velocity.length();
				active = true;
			}
		}
		if (active) {
			ITEMS.fps = this.fps;
			postMessage(ITEMS);
		}
	}

	let getTick = typeof performance === 'undefined' ? function() {
		return Date.now();
	} : function() {
		return performance.now();
	};

	function start() {
		let overallFps_ = 0;
		let tick = 1;
		let fps_ = 0;
		let last = getTick();
		let interval = null;

		function getFPS(delta) {
			/*
			const overallStep_ = 1 / tick++;
			overallFps_ = overallStep_ * delta + (1 - overallStep_) * overallFps_;
			const overallFps = Math.round(1000 / overallFps_);
			this.overallFps = overallFps;
			*/
			const step_ = fps_ > 0 ? Math.min(0.1, delta / 1000) : 0.1; // first run
			fps_ = step_ * delta + (1 - step_) * fps_;
			const fps = Math.round(1000 / fps_);
			this.fps = fps;
		}

		function loop() {
			const now = getTick();
			const delta = now - last;
			stepSimulation(delta);
			last = now;
		}

		if (interval) {
			clearInterval(interval);
		}
		interval = setInterval(loop, 1000 / 120);

	}

	start();

});
