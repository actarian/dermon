/* jshint esversion: 6 */

import Decor from './decor/decor';
import Model from './model/model';
import DomService from './services/dom.service';
import Title from './title/title';
import World from './world/world';

const deg = THREE.Math.degToRad;

const domService = DomService.get();

const worldNode = document.querySelector('[world]');
if (worldNode) {

	const world = new World(worldNode, (world) => {

		/*
		domService.scroll$().subscribe(event => {
			world.lights.rotationScroll.y = event.scrollTop * deg(0.01);
		});
		*/

		const decors = [...document.querySelectorAll('[decor]')].map(node => {
			const decor = new Decor(node, world);
			return decor;
		});

		const models = [...document.querySelectorAll('[model]')].map(node => {
			const model = new Model(node, world);
			return model;
		});

		const titles = [...document.querySelectorAll('[title]')].map(node => {
			const title = new Title(node);
			return title;
		});

	});

}
