/**
 * # Jason
 * @version 0.0.1
 * @license MIT License
 *
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 John Larson
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * Universal javascript serialization library.
 * 
 * Due credit must be given to Chris Wellons (nullprogram.com,
 * github.com/skeeto) and all the contributors to his library,
 * ResurrectJS. Certain aspects of the design of Jason were taken
 * from ResurrectJS, and there are even portions of code copied and
 * pasted directly from ResurrectJS. Thanks, Mr. Wellons!
 *
 * @see https://github.com/johnlarson/Jason/blob/master/README
 */

Jason.prototype.addTypes([
	{
		name: 'Constant',
		storage: 'value',
		identifier: function(object) {
			for(key in this.jason._constants) {
				if(object === this.jason._constants[key]) {
					return true;
				}
			}
			if(typeof object === 'number' && isNaN(object)) {
				return true;
			}
			if(object === -Infinity) {
				return true;
			}
			return false;
		},
		replacer: function(object) {
			if(typeof object === 'number' && isNaN(object)) {
				return 'NaN';
			}
			if(object === -Infinity) {
				return '-Infinity'
			}
			for(key in this.jason._constants) {
				if(object === this.jason._constants[key]) {
					return key;
				}
			}
		},
		reviver: function(object) {
			if(object === 'NaN') {
				return NaN;
			}
			if(object === '-Infinity') {
				return -Infinity;
			}
			if(this.jason._constants[object] === Jason._EVALUATE_AFTER) {
				return eval(object);
			}
			return this.jason._constants[object];
		}
	},
	{
		name: 'Jason.EvaluateAfter',
		storage: 'value',
		identifier: function(object) {
			if(object === kitsu.desk) {
				var b = 78;
			}
			for(var i = 0; i < this.jason._evaluateAfterList.length; i++) {
				if(object === eval(this.jason._evaluateAfterList[i])) {
					return true;
				}
			}
			return false;
		},
		replacer: function(object) {
			for(var i = 0; i < this.jason._evaluateAfterList.length; i++) {
				if(object === eval(this.jason._evaluateAfterList[i])) {
					return this.jason._evaluateAfterList[i];
				}
			}
		},
		reviver: function(object) {
			return eval(object);
		}
	}
]);