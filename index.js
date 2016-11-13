'use strict';

import parse from './lib/parser/index';

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

	for (let i = 1; i < node.repeat.count; i++) {
		const clone = node.clone(true);
		clone.repeat.value = i;
		clone.walk(unroll);
		node.parent.insertBefore(clone, node);
	}

	node.repeat.value = node.repeat.count;
}
