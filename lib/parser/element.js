'use strict';

import Node from '../node';
import consumeAttributes from './attribute';
import consumeTextNode from './text';
import consumeRepeat from './repeat';

const reNameChar = /[\w\-:\$@\!%]/;

/**
 * Consumes a single element node from current abbreviation stream
 * @param  {StringStream} stream
 * @return {Node}
 */
export default function(stream) {
	// consume element name, if provided
	const start = stream.pos;
	const node = new Node(stream.consume(reNameChar));

	while (!stream.eol()) {
		let next;

		if (stream.eat('.')) {
			node.addClass(stream.consume(reNameChar));
		} else if (stream.eat('#')) {
			node.setAttribute('id', stream.consume(reNameChar));
		} else if (stream.eat('/')) {
			// A self-closing indicator must be at the end of non-grouping node
			if (node.isGroup) {
				stream.backUp(1);
				throw stream.error('Unexpected self-closing indicator');
			}
			node.selfClosing = true;
			if (next = consumeRepeat(stream)) {
				node.repeat = next;
			}
			break;
		} else if (next = consumeAttributes(stream)) {
			for (let i = 0, il = next.length; i < il; i++) {
				node.setAttribute(next[i]);
			}
		} else if ((next = consumeTextNode(stream)) !== null) {
			node.value = next;
		} else if (next = consumeRepeat(stream)) {
			node.repeat = next;
		} else {
			break;
		}
	}

	if (start === stream.pos) {
		throw stream.error(`Unable to consume abbreviation node, unexpected ${stream.peek()}`);
	}

	return node;
}
