/* jshint esversion: 6 */

import Emittable from '../interactive/emittable';

export const VR_MODE = {
	NONE: 0,
	VR: 1,
	XR: 2,
};

export class VR extends Emittable {

	get enabled() {
		return this.enabled_;
	}

	set enabled(enabled) {
		if (this.enabled_ !== enabled) {
			this.enabled_ = enabled;
			if (enabled) {
				this.position = this.camera.position.clone();
				this.quaternion = this.camera.quaternion.clone();
				this.renderer.vr.enabled = true;
			} else {
				this.renderer.vr.enabled = false;
				if (this.position && this.quaternion) {
					this.camera.position.copy(this.position);
					this.camera.quaternion.copy(this.quaternion);
				}
			}
		}
	}

	constructor(renderer, options, camera, element) {
		super();
		if (options && options.frameOfReferenceType) {
			renderer.vr.setFrameOfReferenceType(options.frameOfReferenceType);
		}
		this.renderer = renderer;
		this.options = options;
		this.camera = camera;
		this.onVRDisplayConnect = this.onVRDisplayConnect.bind(this);
		this.onVRDisplayDisconnect = this.onVRDisplayDisconnect.bind(this);
		this.onVRDisplayPresentChange = this.onVRDisplayPresentChange.bind(this);
		this.onVRDisplayActivate = this.onVRDisplayActivate.bind(this);
		this.onVRMouseEnter = this.onVRMouseEnter.bind(this);
		this.onVRMouseLeave = this.onVRMouseLeave.bind(this);
		this.onVRClick = this.onVRClick.bind(this);
		this.onXRClick = this.onXRClick.bind(this);
		this.onXRSessionStarted = this.onXRSessionStarted.bind(this);
		this.onXRSessionEnded = this.onXRSessionEnded.bind(this);
		this.mode = this.detectMode();
		// this.mode = VR_MODE.VR;
		this.initElement(element);
		// this.setEnterVR(null);
	}

	detectMode() {
		let mode = VR_MODE.NONE;
		if ('xr' in navigator) {
			mode = VR_MODE.XR;
		} else if ('getVRDisplays' in navigator) {
			mode = VR_MODE.VR;
		}
		return mode;
	}

	initElement(element) {
		try {
			const customElement = this.customElement = element;
			switch (this.mode) {
				case VR_MODE.VR:
					if (element) {
						this.element = element;
					} else {
						element = this.element = this.addElement('button');
						element.style.display = 'none';
					}
					window.addEventListener('vrdisplayconnect', this.onVRDisplayConnect, false);
					window.addEventListener('vrdisplaydisconnect', this.onVRDisplayDisconnect, false);
					window.addEventListener('vrdisplaypresentchange', this.onVRDisplayPresentChange, false);
					window.addEventListener('vrdisplayactivate', this.onVRDisplayActivate, false);
					this.getVR();
					break;
				case VR_MODE.XR:
					if (element) {
						this.element = element;
					} else {
						element = this.element = this.addElement('button');
					}
					this.getXR();
					break;
				default:
					if (element) {
						this.element = element;
						element.classList.add('vr--not-supported');
					} else {
						element = this.element = this.addElement('a');
						element.style.display = 'block';
						element.style.left = 'calc(50% - 90px)';
						element.style.width = '180px';
						element.style.textDecoration = 'none';
						element.href = 'https://webvr.info';
						element.target = '_blank';
						element.innerHTML = 'WEBVR NOT SUPPORTED';
					}
			}
			this.element = element;
		} catch (error) {
			// console.log(error);
			this.emit('error', error);
		}
	}

	addElement(type) {
		const element = document.createElement(type);
		element.style.display = 'none';
		element.style.position = 'absolute';
		element.style.bottom = '20px';
		element.style.padding = '12px 6px';
		element.style.background = 'rgba(0,0,0,0.1)';
		element.style.border = '1px solid #fff';
		element.style.opacity = '0.5';
		element.style.borderRadius = '4px';
		element.style.background = '#E91E63';
		element.style.border = 'none';
		element.style.opacity = '1';
		element.style.borderRadius = '20px';
		element.style.color = '#fff';
		element.style.font = 'normal 13px sans-serif';
		element.style.textAlign = 'center';
		element.style.outline = 'none';
		element.style.zIndex = '999';
		return element;
	}

	getVR() {
		navigator.getVRDisplays().then((displays) => {
			// console.log('navigator.getVRDisplays', displays);
			if (displays.length > 0) {
				this.setEnterVR(displays[0]);
			} else {
				this.setVRNotFound();
			}
		}).catch((e) => {
			console.log('getVR.error', e);
			this.setVRNotFound();
		});
	}

	getXR() {
		navigator.xr.requestDevice().then((device) => {
			device.supportsSession({
				immersive: true,
				exclusive: true /* DEPRECATED */
			}).then(() => {
				this.setEnterXR(device);
			}).catch(() => this.setVRNotFound());
		}).catch((e) => {
			console.log('getXR.error', e);
			this.setVRNotFound();
		});
	}

	setEnterVR(device) {
		this.device = device;
		this.renderer.vr.setDevice(device);
		this.session = null;
		const element = this.element;
		if (this.customElement) {
			element.classList.add('vr--enter', 'vr--vr');
		} else {
			element.style.display = '';
			element.style.cursor = 'pointer';
			element.style.left = 'calc(50% - 50px)';
			element.style.width = '100px';
			element.textContent = 'ENTER VR';
		}
		element.addEventListener('mouseenter', this.onVRMouseEnter);
		element.addEventListener('mouseleave', this.onVRMouseLeave);
		element.addEventListener('click', this.onVRClick);
	}

	setEnterXR(device) {
		this.device = device;
		this.session = null;
		const element = this.element;
		if (this.customElement) {
			element.classList.add('vr--enter', 'vr--xr');
		} else {
			element.style.display = '';
			element.style.cursor = 'pointer';
			element.style.left = 'calc(50% - 50px)';
			element.style.width = '100px';
			element.textContent = 'ENTER XR'; // !!!
		}
		element.addEventListener('mouseenter', this.onVRMouseEnter);
		element.addEventListener('mouseleave', this.onVRMouseLeave);
		element.addEventListener('click', this.onXRClick);
		this.renderer.vr.setDevice(device);
	}

	setVRNotFound() {
		this.renderer.vr.setDevice(null);
		const element = this.element;
		if (this.customElement) {
			element.classList.add('vr--not-found');
		} else {
			element.style.display = '';
			element.style.cursor = 'auto';
			element.style.left = 'calc(50% - 75px)';
			element.style.width = '150px';
			element.textContent = 'VR NOT FOUND';
		}
		element.removeEventListener('mouseenter', this.onVRMouseEnter);
		element.removeEventListener('mouseleave', this.onVRMouseLeave);
		element.removeEventListener('click', this.onVRClick);
		element.removeEventListener('click', this.onXRClick);
	}

	// events

	onVRDisplayConnect(event) {
		this.setEnterVR(event.display);
	}

	onVRDisplayDisconnect(event) {
		this.setVRNotFound(); // ???
	}

	onVRDisplayPresentChange(event) {
		try {
			const isPresenting = event.display.isPresenting;
			this.session = isPresenting;
			if (isPresenting) {
				if (this.customElement) {
					this.element.classList.add('vr--exit');
				} else {
					this.element.textContent = 'EXIT VR';
				}
				this.emit('presenting');
			} else {
				if (this.customElement) {
					this.element.classList.remove('vr--exit');
				} else {
					this.element.textContent = 'ENTER VR';
				}
				this.emit('exit');
			}
		} catch (error) {
			this.emit('error', error);
		}
	}

	onVRDisplayActivate(event) {
		try {
			this.emit('beforepresenting');
			event.display.requestPresent([{
				source: this.renderer.domElement
			}]).then(() => {
				this.emit('presenting');
			}, (error) => {
				console.log('onVRDisplayActivate', error);
				this.emit('error', error);
			});
		} catch (error) {
			this.emit('error', error);
		}
	}

	onVRMouseEnter(event) {
		this.element.style.opacity = '1.0';
	}

	onVRMouseLeave(event) {
		this.element.style.opacity = '0.5';
	}

	onVRClick(event) {
		try {
			const device = this.device;
			if (device.isPresenting) {
				this.emit('beforeexiting');
				device.exitPresent();
				this.enabled = false;
			} else {
				this.emit('beforepresenting');
				this.enabled = true;
				device.requestPresent([{
					source: this.renderer.domElement
				}]).then(() => {
					this.emit('presenting');
				}, (error) => {
					console.log('onVRClick', error);
					this.emit('error', error);
				});
			}
		} catch (error) {
			this.emit('error', error);
		}
	}

	onXRClick(event) {
		try {
			const device = this.device;
			if (this.session === null) {
				this.emit('beforepresenting');
				this.enabled = true;
				device.requestSession({
					immersive: true,
					exclusive: true /* DEPRECATED */
				}).then(this.onXRSessionStarted);
				/*
				if (Tone.context.state !== 'running') {
					Tone.context.resume();
				}
				*/
			} else {
				this.emit('beforeexiting');
				this.session.end();
				this.enabled = false;
			}
		} catch (error) {
			this.emit('error', error);
		}
	}

	onXRSessionStarted(session) {
		try {
			session.addEventListener('end', this.onXRSessionEnded);
			this.renderer.vr.setSession(session);
			this.session = session;
			if (this.customElement) {
				this.element.classList.add('vr--exit');
			} else {
				this.element.textContent = 'EXIT VR';
			}
			this.emit('presenting');
		} catch (error) {
			this.emit('error', error);
		}
	}

	onXRSessionEnded(event) {
		try {
			this.session.removeEventListener('end', this.onXRSessionEnded);
			this.renderer.vr.setSession(null);
			this.session = null;
			if (this.customElement) {
				this.element.classList.remove('vr--exit');
			} else {
				this.element.textContent = 'ENTER VR';
			}
			this.emit('exit');
		} catch (error) {
			this.emit('error', error);
		}
	}

}

/*
VRDisplays[0]: VRDisplay {
	capabilities: VRDisplayCapabilities {
		canPresent: true
		hasExternalDisplay: false
		hasOrientation: true
		hasPosition: true
		maxLayers: 1
	}
	depthFar: 10000
	depthNear: 0.01
	displayId: 1
	displayName: "Oculus Quest"
	isConnected: true
	isPresenting: false
	stageParameters: VRStageParameters {
		sittingToStandingTransform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1.649999976158142, 0, 1]
		sizeX: 0
		sizeZ: 0
	}
}
*/
