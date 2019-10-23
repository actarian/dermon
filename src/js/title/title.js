/* jshint esversion: 6 */

import Ease from '../ease/ease';
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
		const node = this.node;
		const splitting = this.splitting;
		const h = node.offsetHeight;
		const direction = node.getAttribute('title') || 'left';
		const tweens = splitting.chars.map((char, index) => {
			// const index = getComputedStyle(char).getPropertyValue('--char-index');
			if (direction === 'left') {
				const i = (splitting.chars.length - index);
				let pow = intersection.offset(100 + i * 50, 2);
				pow = Math.max(0, Math.min(1, pow + 1)); // to 0-1
				pow = Ease.Expo.InOut(pow);
				TweenMax.set(char, {
					x: -(5 + 0.1 * i) * (h * 0.1) * (1 - pow),
					opacity: pow
				});
			} else {
				const i = index;
				let pow = intersection.offset(100 + i * 50, 2);
				pow = Math.max(0, Math.min(1, pow + 1)); // to 0-1
				pow = Ease.Expo.InOut(pow);
				TweenMax.set(char, {
					x: (5 + 0.1 * i) * (h * 0.1) * (1 - pow),
					opacity: pow
				});
			}
		});
	}

}
