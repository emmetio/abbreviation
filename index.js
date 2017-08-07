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
export default function (abbr, limit) {
	const tree = parse(abbr);
	limit = { value: limit };
	tree.walk(node => unroll(node, limit))
	return tree;
}

function unroll(node, guard) {
	if (guard.value <= 0) {
		clearNode(node);
		return false;
	}

	if (!node.repeat || !node.repeat.count) {
		if (!node.isGroup) {
			guard.value--;
		}
		return;
	}

	for (let i = 0; i < node.repeat.count; i++) {
		const clone = node.clone(true);
		clone.repeat.value = i+1;
		clone.walk(node => unroll(node, guard));
		if (clone.isGroup) {
			while (clone.children.length > 0) {
				clone.firstChild.repeat = clone.repeat;
				node.parent.insertBefore(clone.firstChild, node);
			}
		} else {
			guard.value--;
			node.parent.insertBefore(clone, node);
		}

		if (guard.value <= 0) {
			clearNode(node);
			return false;
		}
	}

	node.parent.removeChild(node);
}

// Remove node, it's children and siblings that come after it.
function clearNode(nodeToClear) {
	if (!nodeToClear) {
		return;
	}
	nodeToClear.children = [];
	if (!nodeToClear.parent) {
		return;
	}
	var next = nodeToClear.nextSibling;
	while (next) {
		var temp = next.nextSibling;
		nodeToClear.parent.removeChild(next);
		next = temp;
	}
	nodeToClear.parent.removeChild(nodeToClear);
}
