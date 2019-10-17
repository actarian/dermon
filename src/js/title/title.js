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

	easeQuadOut(t) {
		t = t * 2.0;
		if (t === 0.0) return 0.0;
		if (t === 1.0) return 1.0;
		if (t < 1.0) return 0.5 * Math.pow(2.0, 10.0 * (t - 1.0));
		return 0.5 * (-Math.pow(2.0, -10.0 * --t) + 2.0);
	}

	update(intersection, rect, windowRect) {
		const node = this.node;
		const splitting = this.splitting;
		const h = node.offsetHeight;
		const direction = node.getAttribute('title') || 'left';
		const tweens = splitting.chars.map((char, index) => {
			// const index = getComputedStyle(char).getPropertyValue('--char-index');
			if (direction === 'left') {
				const i = (splitting.chars.length - index);
				let pow = this.easeQuadOut(1 - (intersection.offset(i * h * 0.2, 2)));
				TweenMax.set(char, {
					x: -(5 + 0.1 * i) * h * pow,
					opacity: (1 - pow)
				});
			} else {
				const i = index;
				let pow = this.easeQuadOut(1 - (intersection.offset(i * h * 0.2, 2)));
				TweenMax.set(char, {
					x: (5 + 0.1 * i) * h * pow,
					opacity: (1 - pow)
				});
			}
		});
	}

}
