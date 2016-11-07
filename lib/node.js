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

        this.name = name || null;
		this._attributes = new Map();
        this.value = null;

        if (Array.isArray(attributes)) {
            attributes.forEach(attr => this.addAttribute(atr));
        }
    }

    /**
     * Array of current node attributes
     * @return {Array} Array of `Attribute` items
     */
    get attributes() {
        return Array.from(this._attributes.values());
    }

    addAttribute(name, value) {
        let attr;
        if (name instanceof Attribute) {
            attr = name;
        } else if (typeof name === 'string') {
            attr = new Attribute(name, value);
        } else if (name && typeof name === 'object') {
            attr = new Attribute(name.name, name.value);
        }

        this._attributes.set(attr.name, attr.value);
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
