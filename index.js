'use strict';

import parse from './lib/parser';

/**
 * Parses given abbreviation and un-rolls it into a full tree: recursively
 * replaces repeated elements with actual nodes
 * @param  {String} abbr
 * @return {Node}
 */
export default function(abbr) {
	const tree = parse(abbr);
	tree.walk(unroll);
	return tree;
}

function unroll(node) {
	if (!node.repeat || !node.repeat.count) {
		return;
	}

	const parent = node.parent;
	let ix = parent.children.indexOf(node);

	for (let i = 0; i < node.repeat.count; i++) {
		const clone = node.clone(true);
		clone.repeat.value = i + 1;
		clone.walk(unroll);

		if (clone.isGroup) {
			while (clone.children.length > 0) {
				clone.firstChild.repeat = clone.repeat;
				parent.insertAt(clone.firstChild, ix++);
			}
		} else {
			parent.insertAt(clone, ix++);
		}
	}

	node.parent.removeChild(node);
}
