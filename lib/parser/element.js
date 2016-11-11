'use strict';

import Node from '../node';
import consumeAttributes from './attribute';
import consumeTextNode from './text';
import consumeRepeat from './repeat';

const reWordChar = /[\w\-:\$@]/;
const reNameChar = /[\w\-\$\:@\!%]/;

/**
 * Consumes a single element node from current abbreviation stream
 * @param  {StringStream} stream
 * @return {Node}
 */
export default function(stream) {
	const node = new Node();
	const start = stream.pos;

	while (!stream.eol()) {
		const ch = stream.peek();

		if (ch === '.') {
			stream.next();
			node.addClass(stream.consume(reWordChar));
		} else if (ch === '#') {
			stream.next();
			node.setAttribute('id', stream.consume(reWordChar));
		} else if (ch === '[') {
			const attrs = consumeAttributes(stream);
			for (let i = 0, il = attrs.length; i < il; i++) {
				node.setAttribute(attrs[i]);
			}
		} else if (ch === '{') {
			node.value = consumeTextNode(stream);
		} else if (reNameChar.test(ch) && stream.pos === start) {
			node.name = stream.consume(reNameChar);
		} else if (ch === '*') {
			node.repeat = consumeRepeat(stream);
		} else if (ch === '/') {
			// A self-closing indicator must be at the end of non-grouping node
			if (node.isGroup) {
				throw stream.error('Unexpected self-closing indicator');
			}
			stream.next();
			node.selfClosing = true;
			break;
		} else {
			break;
		}
	}

	if (start === stream.pos) {
		throw stream.error(`Unable to consume abbreviation node, unexpected ${stream.peek()}`);
	}

	return node;
}
