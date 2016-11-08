'use strict';

/**
 * Attribute description of parsed abbreviation node
 */
export default class Attribute {
	constructor(name, value, options) {
		this.name = name;
		this.options = options || {};

		// store "class" attribute as Set
		if (name === 'class') {
			if (value == null || value === '') {
				value = [];
			}
			this.value = new Set(Array.isArray(value) ? value : [value]);
		} else {
			this.value = value || null;
		}
	}

	valueOf() {
		let value = this.value;
		if (value instanceof Set) {
			value = Array.from(value);
		}

		return Array.isArray(value) ? value.join(' ') : value;
	}
};
