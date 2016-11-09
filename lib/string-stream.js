'use strict';

/**
 * A string reader
 */
export default function(str) {
	return new StringStream(str);
}

class StringStream {
	constructor(string) {
		this.pos = this.start = 0;
		this.string = string;
		this._length = string.length;
	}

	/**
	 * Returns true only if the stream is at the end of the line.
	 * @returns {Boolean}
	 */
	eol() {
		return this.pos >= this._length;
	}

	/**
	 * Returns the next character in the stream without advancing it.
	 * Will return <code>undefined</code> at the end of the line.
	 * @returns {String}
	 */
	peek() {
		return this.string.charAt(this.pos);
	}

	/**
	 * Returns the next character in the stream and advances it.
	 * Also returns <code>undefined</code> when no more characters are available.
	 * @returns {String}
	 */
	next() {
		if (this.pos < this._length) {
			return this.string.charAt(this.pos++);
		}
	}

	/**
	 * match can be a character, a regular expression, or a function that
	 * takes a character and returns a boolean. If the next character in the
	 * stream 'matches' the given argument, it is consumed and returned.
	 * Otherwise, undefined is returned.
	 * @param {Object} match
	 * @returns {String}
	 */
	eat(match) {
		const ch = this.string.charAt(this.pos);
		let ok;

		if (typeof match === "string") {
			ok = ch === match;
		} else {
			ok = ch && (match.test ? match.test(ch) : match(ch));
		}

		if (ok) {
			++this.pos;
			return ch;
		}
	}

	/**
	 * Repeatedly calls <code>eat</code> with the given argument, until it
	 * fails. Returns <code>true</code> if any characters were eaten.
	 * @param {Object} match
	 * @returns {Boolean}
	 */
	eatWhile(match) {
		const start = this.pos;
		while (this.eat(match)) {}
		return this.pos > start;
	}

	/**
	 * Skips to the next occurrence of the given character, if found on the
	 * current line (doesn't advance the stream if the character does not
	 * occur on the line). Returns true if the character was found.
	 * @param {String} ch
	 * @returns {Boolean}
	 */
	skipTo(ch) {
		const found = this.string.indexOf(ch, this.pos);
		if (found > -1) {
			this.pos = found;
			return true;
		}
	}

	/**
	 * Backs up the stream n characters. Backing it up further than the
	 * start of the current token will cause things to break, so be careful.
	 * @param {Number} n
	 */
	backUp(n) {
		this.pos -= n;
	}

	/**
	 * Get the string between the start of the current token and the
	 * current stream position.
	 * @returns {String}
	 */
	current() {
		return this.string.slice(this.start, this.pos);
	}

	/**
	 * Consumes word from current stream that matches given `match` argument
	 * and returns it
	 */
	consume(match) {
		this.start = this.pos;
		this.eatWhile(match);
		return this.current();
	}

	/**
	 * A helper function to skip string literal, e.g. a "double-quoted"
	 * or 'single-quoted' value
	 * @param  {String} quote An opening quote
	 * @return {Boolean}
	 */
	skipQuoted(quote) {
		let pos = this.pos;
		const len = this.string.length;

		while (pos < len) {
			const ch = this.string.charAt(pos++);
			if (ch === '\\') {
				pos++;
				continue;
			} else if (ch === quote) {
				this.pos = pos;
				return true;
			}
		}

		return false;
	}

	/**
	 * Creates error object with current stream state
	 * @param {String} message
	 * @return {Error}
	 */
	error(message) {
		const err = new Error(`${message} at char ${this.pos + 1} of "${this.string}" string`);
		err.originalMessage = message;
		err.pos = this.pos;
		err.string = this.string;
		return err;
	}
};
