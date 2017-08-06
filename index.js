'use strict';

import parse from './lib/parser';

/**
 * Parses given abbreviation and un-rolls it into a full tree: recursively
 * replaces repeated elements with actual nodes until the total number of nodes
 * reach the given limit.
 * If no limit is provided, then no limit is applied.
 * @param  {String} abbr
 * @param  {Number} limit
 * @return {Node}
 */
export default function(abbr, limit) {
	const tree = parse(abbr);
	if (!limit || !Number(limit)) {
		tree.walk(unroll);
	} else {
		unrollNodeUptoLimit(tree, limit);
	}
	return tree;
}

function unroll(node) {
	if (!node.repeat || !node.repeat.count) {
		return;
	}

	for (let i = 0; i < node.repeat.count; i++) {
		const clone = node.clone(true);
		clone.repeat.value = i+1;
		clone.walk(unroll);
		if (clone.isGroup) {
			while (clone.children.length > 0) {
				clone.firstChild.repeat = clone.repeat;
				node.parent.insertBefore(clone.firstChild, node);
			}
		} else {
			node.parent.insertBefore(clone, node);
		}
	}
	
	node.parent.removeChild(node);
}

// Unrolls given node until total number of nodes reach the given limit
function unrollNodeUptoLimit(node, limit) {
	if (limit < 0) {
		return limit;
	}
	
	// Current node is not a repeated node, unroll its children
	if (!node.repeat || !node.repeat.count) {
		return unrollChildrenUptoLimit(node, limit);
	}

	// Curent node is a repeated node. 
	// Make clones of it, unroll its children and append the clones to the parent.
	// If Current node is a group, then append its children to the parent instead
	for (let i = 0; i < node.repeat.count; i++) {
		if (limit <= 0) {
			break;
		}

		const clone = node.clone(true);
		clone.repeat.value = i+1;
		limit = unrollChildrenUptoLimit(clone, limit);
		
		if (clone.isGroup) {
			while (clone.children.length > 0) {
				clone.firstChild.repeat = clone.repeat;
				node.parent.insertBefore(clone.firstChild, node);
			}
		} else {
			node.parent.insertBefore(clone, node);
		}
	}
	
	node.parent.removeChild(node);
	return limit;
}

// Unrolls children of the node until total number of nodes reach the given limit
function unrollChildrenUptoLimit(node, limit) {
	if (!node.isGroup) {
		limit--;
	}
	if (node.children) {
		// Make a copy of the children before unrolling as more might get added during unrolling
		var nodeChildren = node.children.slice();
		for (var i = 0; i < nodeChildren.length; i++) {
			if (limit > 0) {
				limit = unrollNodeUptoLimit(nodeChildren[i], limit);
			} else {
				node.removeChild(nodeChildren[i]);
			}
		}
	}
	return limit;
}