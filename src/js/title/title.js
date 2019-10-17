/* jshint esversion: 6 */

import DomService from '../services/dom.service';

const domService = DomService.get();

export default class Title {

	constructor(node) {
		this.node = node;
		const splitting = Splitting({
			target: node,
			by: 'chars',
			key: null
		})[0];
		this.splitting = splitting;
		domService.scrollIntersection$(node, 2).subscribe(event => {
			this.update(event.intersection, event.rect, event.windowRect);
		});
	}

	update(intersection, rect, windowRect) {
		const pow = 1 - (intersection.pow.y);
		const node = this.node;
		const splitting = this.splitting;
		const h = node.offsetHeight;
		const tweens = splitting.chars.map((char, index) => {
			// const index = getComputedStyle(char).getPropertyValue('--char-index');
			const i = (splitting.chars.length - index);
			TweenMax.set(char, {
				x: -5 * h * pow - i * h * pow,
			});
		});
	}

}
