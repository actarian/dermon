/* jshint esversion: 6 */

const Ease = {
	Linear: function(t) {
		return t;
	},
	Quad: {
		In: function(t) {
			return t * t;
		},
		Out: function(t) {
			return t * (2 - t);
		},
		InOut: function(t) {
			if ((t *= 2) < 1) {
				return 0.5 * t * t;
			}
			return -0.5 * (--t * (t - 2) - 1);
		},
	},
	Cubic: {
		In: function(t) {
			return t * t * t;
		},
		Out: function(t) {
			return --t * t * t + 1;
		},
		InOut: function(t) {
			if ((t *= 2) < 1) {
				return 0.5 * t * t * t;
			}
			return 0.5 * ((t -= 2) * t * t + 2);
		},
	},
	Quart: {
		In: function(t) {
			return t * t * t * t;
		},
		Out: function(t) {
			return 1 - (--t * t * t * t);
		},
		InOut: function(t) {
			if ((t *= 2) < 1) {
				return 0.5 * t * t * t * t;
			}
			return 0.5 * ((t -= 2) * t * t * t - 2);
		},
	},
	Quint: {
		In: function(t) {
			return t * t * t * t * t;
		},
		Out: function(t) {
			return --t * t * t * t * t + 1;
		},
		InOut: function(t) {
			if ((t *= 2) < 1) {
				return 0.5 * t * t * t * t * t;
			}
			return 0.5 * ((t -= 2) * t * t * t * t + 2);
		},
	},
	Sine: {
		In: function(t) {
			return 1 - Math.cos(t * Math.PI / 2);
		},
		Out: function(t) {
			return Math.sin(t * Math.PI / 2);
		},
		InOut: function(t) {
			return 0.5 * (1 - Math.cos(Math.PI * t));
		},
	},
	Bounce: {
		In: function(t) {
			return 1 - outBounce(1 - t);
		},
		Out: function(t) {
			if (t < 0.36363636363636365) {
				return 7.5625 * t * t;
			} else if (t < 0.7272727272727273) {
				t = t - 0.5454545454545454;
				return 7.5625 * t * t + 0.75;
			} else if (t < 0.9090909090909091) {
				t = t - 0.8181818181818182;
				return 7.5625 * t * t + 0.9375;
			} else {
				t = t - 0.9545454545454546;
				return 7.5625 * t * t + 0.984375;
			}
		},
		InOut: function(t) {
			if (t < 0.5) {
				return Easings.InBounce(t * 2) * 0.5;
			}
			return Easings.OutBounce(t * 2 - 1) * 0.5 + 1 * 0.5;
		},
	},
	Elastic: {
		In: function(t, amplitude, period) {
			if (typeof period == 'undefined') {
				period = 0;
			}
			if (typeof amplitude == 'undefined') {
				amplitude = 1;
			}
			var offset = 1.70158;
			if (t === 0) {
				return 0;
			}
			if (t === 1) {
				return 1;
			}
			if (!period) {
				period = 0.3;
			}
			if (amplitude < 1) {
				amplitude = 1;
				offset = period / 4;
			} else {
				offset = period / (2 * Math.PI) * Math.asin(1 / amplitude);
			}
			return -(amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - offset) * (Math.PI * 2) / period));
		},
		Out: function(t, amplitude, period) {
			if (typeof period == 'undefined') {
				period = 0;
			}
			if (typeof amplitude == 'undefined') {
				amplitude = 1;
			}
			var offset = 1.70158;
			if (t === 0) { return 0; }
			if (t === 1) { return 1; }
			if (!period) {
				period = 0.3;
			}
			if (amplitude < 1) {
				amplitude = 1;
				offset = period / 4;
			} else {
				offset = period / (2 * Math.PI) * Math.asin(1 / amplitude);
			}
			return amplitude * Math.pow(2, -10 * t) * Math.sin((t - offset) * (Math.PI * 2) / period) + 1;
		},
		InOut: function(t, amplitude, period) {
			var offset;
			t = (t / 2) - 1;
			// escape early for 0 and 1
			if (t === 0 || t === 1) {
				return t;
			}
			if (!period) {
				period = 0.44999999999999996;
			}
			if (!amplitude) {
				amplitude = 1;
				offset = period / 4;
			} else {
				offset = period / (Math.PI * 2.0) * Math.asin(1 / amplitude);
			}
			return (amplitude * Math.pow(2, 10 * t) * Math.sin((t - offset) * (Math.PI * 2) / period)) / -2;
		},
	},
	Expo: {
		In: function(t) {
			return Math.pow(2, 10 * (t - 1));
		},
		Out: function(t) {
			return -Math.pow(2, -10 * t) + 1;
		},
		InOut: function(t) {
			if (t === 0) {
				return 0;
			}
			if (t === 1) {
				return 1;
			}
			if ((t /= 0.5) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
			return 0.5 * (-Math.pow(2, -10 * --t) + 2);
		},
	},
	Circ: {
		In: function(t) {
			return -1 * (Math.sqrt(1 - t * t) - 1);
		},
		Out: function(t) {
			t = t - 1;
			return Math.sqrt(1 - t * t);
		},
		InOut: function(t) {
			var c = 1;
			if ((t /= 0.5) < 1) {
				return -0.5 * (Math.sqrt(1 - t * t) - 1);
			}
			return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
		},
	},
	Back: {
		In: function(t, overshoot) {
			if (!overshoot && overshoot !== 0) {
				overshoot = 1.70158;
			}
			return 1 * t * t * ((overshoot + 1) * t - overshoot);
		},
		Out: function(t, overshoot) {
			if (!overshoot && overshoot !== 0) {
				overshoot = 1.70158;
			}
			t = t - 1;
			return t * t * ((overshoot + 1) * t + overshoot) + 1;
		},
		InOut: function(t, overshoot) {
			if (overshoot === undefined) {
				overshoot = 1.70158;
			}
			if ((t /= 0.5) < 1) {
				return 0.5 * (t * t * (((overshoot *= (1.525)) + 1) * t - overshoot));
			}
			return 0.5 * ((t -= 2) * t * (((overshoot *= (1.525)) + 1) * t + overshoot) + 2);
		}
	}
};

const outBounce = Ease.Bounce.Out;

export default Ease;
