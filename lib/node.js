'use strict';

import Attribute from './attribute';

/**
 * A parsed abbreviation node. Nodes build up an abbreviation tree
 */
export default class Node {
    /**
     * Creates a new node
     * @param {String} name Node name
     * @param {Array} [attributes] Array of `Attribute` items
     */
    constructor(name, attributes) {
        /** @type Node */
		this.parent = null;
		this.children = [];
		this._attributes = new Map();

        this.name = name || null;
        this.value = null;

        if (Array.isArray(attributes)) {
            attributes.forEach(attr => this.addAttribute(atr));
        }
    }

    /**
     * Array of current node attributes
     * @return {Array} Array of plain attribute objects with
     * `name` and `value` properties
     */
    get attributes() {
        return Array.from(this._attributes.values()).map(attrToObject);
    }

    addAttribute(name, value) {
        let attr;
        if (name instanceof Attribute) {
            attr = name;
        } else if (typeof name === 'string') {
            attr = new Attribute(name, value);
        } else if (name && typeof name === 'object') {
            attr = new Attribute(name.name, name.value, name.boolean);
        }

        this._attributes.set(attr.name, attr.value);
    }

	/**
	 * Check if attribute with given name exists in node
	 * @param  {String} name
	 * @return {Boolean}
	 */
    hasAttribute(name) {
        return this._attributes.has(name);
    }

	/**
	 * Returns attribute object by given name
	 * @param  {String} name
	 * @return {Attribute}
	 */
	getAttribute(name) {
		return this._attributes.get(name);
	}

	/**
	 * Adds given class name to class attribute
	 * @param {String} token Class name token
	 */
    addClass(token) {
		token = String(token).trim();
        if (!this.hasAttribute('class')) {
			this.addAttribute('class', token);
		} else if (token != null && token !== '') {
			this.getAttribute('class').add(token);
		}
    }

	/**
	 * Check if current node contains given class name
	 * @param {String} token Class name token
	 * @return {Boolean}
	 */
	hasClass(token) {
		token = String(token).trim();
		return this.hasAttribute('class') && this.getAttribute('class').has(token);
	}

	/**
	 * Removes given class name from class attribute
	 * @param {String} token Class name token
	 */
	removeClass(token) {
		token = String(token).trim();
		if (this.hasClass(token)) {
			this.getAttribute('class').delete(token);
		}
	}

    /**
     * Appends child to current node
     * @param {Node} node
     */
    appendChild(node) {
        node.parent = this;
        this.children.push(node);
    }

    /**
     * Removes given child from current node
     * @param {Node} node
     */
    removeChild(node) {
        const ix = this.children.indexOf(node);
        if (ix !== -1) {
            this.children.splice(ix, 1);
            node.parent = null;
        }
    }

    /**
     * Removes current node from its parent
     */
    remove() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}

function attrToObject(attr) {
	return {
		name: attr.name,
		value: attr.valueOf()
	};
}
