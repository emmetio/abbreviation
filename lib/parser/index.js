'use strict';

import StreamReader from '@emmetio/stream-reader';
import consumeRepeat from './repeat';
import consumeElement from './element';
import Node from '../node';
import { last } from '../utils';

/**
 * Parses given string into a node tree
 * @param  {String} str Abbreviation to parse
 * @return {Node}
 */
export default function parse(str) {
	const stream = new StreamReader(str.trim());
	const root = new Node();
	let ctx = root;
	let groupStack = [];

	while (!stream.eol()) {
		const ch = stream.peek();
		if (ch === '(') { // start of group
			// The grouping node should be detached to properly handle
			// out-of-bounds `^` operator. Node will be attached right on group end
			const node = new Node();
			const groupCtx = groupStack.length ? last(groupStack)[0] : ctx;
			groupStack.push([node, groupCtx, stream.pos]);
			ctx = node;
			stream.next();
			continue;
		} else if (ch === ')') { // end of group
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
				stream.eat('+');
			}

			continue;
		}

		const node = consumeElement(stream);
		ctx.appendChild(node);

		switch (stream.peek()) {
			case '':  // end-of-line
			case '+': // sibling operator
				stream.next();
				continue;

			case '>': // child operator
				stream.next();
				ctx = node;
				continue;

			case '^': // climb-up operator
				// it’s perfectly valid to have multiple `^` operators
				while (stream.next() === '^') {
					ctx = ctx.parent || ctx;
				}
				stream.backUp(1);
				continue;
		}
	}

	if (groupStack.length) {
		stream.pos = groupStack.pop()[2];
		throw stream.error('Expected group close');
	}

	return root;
}
