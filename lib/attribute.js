'use strict';

/**
 * Attribute description of parsed abbreviation node
 */
export default class Attribute {
	constructor(name, value, options) {
		this.name = name;
		this.value = value || null;
		this.options = options || {};
	}

	/**
	 * Create a copy of current attribute
	 * @return {Attribute}
	 */
	clone() {
		return new Attribute(this.name, this.value, Object.assign({}, this.options));
	}

	/**
	 * A string representation of current node
	 */
	valueOf() {
		return this.value;
	}
};
