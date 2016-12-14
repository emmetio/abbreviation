'use strict';

/**
 * Attribute descriptor of parsed abbreviation node
 * @param {String} name Attribute name
 * @param {String} value Attribute value
 * @param {Object} options Additional custom attribute options
 * @param {Boolean} options.boolean Attribute is boolean (e.g. name equals value)
 * @param {Boolean} options.implied Attribute is implied (e.g. must be outputted
 * only if contains non-null value)
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
		return `${this.name}="${this.value}"`;
	}
};
