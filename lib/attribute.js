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

			this.value = new Set(typeof value === 'string' ? value.split(/\s+/g) : value);
		} else {
			this.value = value || null;
		}
	}

	/**
	 * Create a copy of current attribute
	 * @return {Attribute}
	 */
	clone() {
		return new Attribute(this.name, this.valueOf(), Object.assign({}, this.options));
	}

	/**
	 * A string representation of current node
	 */
	valueOf() {
		let value = this.value;
		if (value instanceof Set) {
			value = Array.from(value);
		}

		return Array.isArray(value) ? value.join(' ') : value;
	}
};
