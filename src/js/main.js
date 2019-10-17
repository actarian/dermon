/* jshint esversion: 6 */

import Example01 from './examples/example-01';
import Model from './model/model';
import DomService from './services/dom.service';
import { deg } from './threejs/const';
import Title from './title/title';

const domService = DomService.get();

const example = document.querySelector('[example-01]');
if (example) {
	const three = new Example01(example);

	domService.scroll$().subscribe(event => {
		three.lights.rotationScroll.y = event.scrollTop * deg(0.01);
	});

	const models = [...document.querySelectorAll('[model]')].map(x => {
		const model = new Model(x, three);
		return model;
	});

	const titles = [...document.querySelectorAll('[title]')].map(x => {
		const title = new Title(x);
		return title;
	});
}
