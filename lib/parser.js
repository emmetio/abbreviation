'use strict';

import Node from '@emmetio/node';
import StreamReader from '@emmetio/stream-reader';
import consumeRepeat from './repeat';
import consumeElement from './element';

const GROUP_START = 40; // (
const GROUP_END   = 41; // )
const OP_SIBLING  = 43; // +
const OP_CHILD    = 62; // >
const OP_CLIMB    = 94; // ^

/**
 * Parses given string into a node tree
 * @param  {String} str Abbreviation to parse
 * @return {Node}
 */
export default function parse(str) {
	const stream = new StreamReader(str.trim());
	const root = new Node();
	let ctx = root, groupStack = [], ch;

	while (!stream.eof()) {
		ch = stream.peek();

		if (ch === GROUP_START) { // start of group
			// The grouping node should be detached to properly handle
			// out-of-bounds `^` operator. Node will be attached right on group end
			const node = new Node();
			const groupCtx = groupStack.length ? last(groupStack)[0] : ctx;
			groupStack.push([node, groupCtx, stream.pos]);
			ctx = node;
			stream.next();
			continue;
		} else if (ch === GROUP_END) { // end of group
			const lastGroup = groupStack.pop();
			if (!lastGroup) {
				throw stream.error('Unexpected ")" group end');
			}

			const node = lastGroup[0];
			ctx = lastGroup[1];
			stream.next();

			// a group can have a repeater
			if (node.repeat = consumeRepeat(stream)) {
				ctx.appendChild(node);
			} else {
				// move all children of group into parent node
				while (node.firstChild) {
					ctx.appendChild(node.firstChild);
				}
				// for convenience, groups can be joined with optional `+` operator
				stream.eat(OP_SIBLING);
			}

			continue;
		}

		const node = consumeElement(stream);
		ctx.appendChild(node);

		if (stream.eof()) {
			break;
		}

		switch (stream.peek()) {
			case OP_SIBLING:
				stream.next();
				continue;

			case OP_CHILD:
				stream.next();
				ctx = node;
				continue;

			case OP_CLIMB:
				// it’s perfectly valid to have multiple `^` operators
				while (stream.eat(OP_CLIMB)) {
					ctx = ctx.parent || ctx;
				}
				continue;
		}
	}

	if (groupStack.length) {
		stream.pos = groupStack.pop()[2];
		throw stream.error('Expected group close');
	}

	return root;
}

function last(arr) {
	return arr[arr.length - 1];
}
