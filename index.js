'use strict';

import Node from './lib/node';
import createStream from './lib/string-stream';

const pairs = {
    '[': ']',
    '(': ')',
    '{': '}'
};
const reversePairs = {
    ']': '[',
    ')': '(',
    '}': '{'
};
const operators = new Set(['>', '^', '+']);

/**
 * Parses given string into a node tree
 * @param  {String} str Abbreviation to parse
 * @return {Node}
 */
export default function parse(str) {
    const stream = createStream(str.trim());
    const root = new Node();
    let ctx = root;

    while (!stream.eol()) {
        const operator = operators.has(stream.peek()) ? stream.next() : null;

        // resolve node insertion point by operator
        switch (operator) {
            case '+': // sibling operator
                if (ctx.parent) {
                    ctx = ctx.parent;
                }
                break;

            case '^': // climb up operator
                stream.backUp(1);

                // it’s perfectly valid to have multiple `^` operators
                while (stream.peek() === '^') {
                    if (ctx.parent) {
                        ctx = ctx.parent;
                    }
                    stream.next();
                }
                break;
        }

        const node = ctx.parent(stream);
        ctx = ctx.appendChild(node);
        ctx = node;
    }

    return root;
}

/**
 * Consumes a single node from current abbreviation string
 * @param  {StringStream} stream
 * @return {Node}
 */
function consumeNode(stream) {
    const node = new Node();

    while (!stream.eol()) {
        
    }
}

function error(stream, messege) {
    const err = new Error(`${messege} at character ${stream.pos} of "${stream.string}" abbreviation`);
    err.pos = stream.pos;
    err.abbreviation = stream.string;
    err.code = 'EINVALIDABBREVIATION';
    throw err;
}
