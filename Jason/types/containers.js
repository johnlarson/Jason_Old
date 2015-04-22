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
		name: 'Window',
		identifier: function(object) {
			return object === window;
		},
		properties: function() {
			var result = {};
			var windowKeys = keys(window);
			for(var i = 0; i < windowKeys.length; i++) {
				if(!(windowKeys[i] in Jason._reference.windowNatives)) {
					result[windowKeys[i]] = window[windowKeys[i]];
				}
			}
			return result;
		},
		reviver: function() {
			return window;
		}
	},
	{
		name: 'Array',
		identifier: function(object) {
			return object instanceof Array;
		},
		properties: 'auto',
		reviver: function() {
			return [];
		}
	},
	{
		name: 'Date',
		identifier: function(object) {
			return object instanceof Date;
		},
		replacer: function(object) {
			return object.toISOString();
		},
		reviver: function(object) {
			return new Date(object);
		}
	},
	{
		name: 'Event',
		identifier: function(object) {
			return object instanceof Event;
		},
		replacer: function(object) {
			var result = {
				constr: object.constructor.name,
				typeArg: object.type,
				eventInitDict: {}
			};
			for(key in object) {
				if(key !== 'constructor') {
					result.eventInitDict[key] = this.visit(object[key], key, replacer, object);
				}
			}
			return result;
		},
		reviver: function(object) {
			var constructor = Jason._reduceToReference(object.constr);
			var typeArg = object.typeArg;
			var eventInitDict = {};
			for(key in object.eventInitDict) {
				eventInitDict[key] === this.unpackVar(object.eventInitDict[key], window);
			}
			return new constructor(typeArg, eventInitDict);
		}
	},
	{
		name: 'Function',
		identifier: function(object) {
			return object instanceof Function;
		},
		replacer: function(object, parent) {
			return {
				parent: parent,
				string: Jason._reference.functionToString(object)
			};
		},
		properties: 'auto',
		reviver: function(object) {
			var prefix = 
				"if (this != window){" +
        	   		"for (var __i in this ){" +
                        "eval( 'var ' + __i + ' = this[ __i ];' );" +
                    "}" +
                "}";
        	var finalString = prefix + object.string;
            var finalFunction = function() {
                return (Function(finalString));
            };
			var actualFunction = finalFunction.bind(object.parent);
			return actualFunction;
		}
	},
	{
		name: 'Node',
		identifier: function(object) {
			return object instanceof Node;
		},
		replacer: function(object) {
			return new XMLSerializer().serializeToString(object);
			//return Jason.xmlToString(object);
		},
		reviver: function(object) {
			var div = document.createElement('div');
			div.innerHTML = object;
			return div.firstChild;
		}
	},
	{
		name: 'Object',
		identifier: function(object) {
			return object instanceof Object;
		},
		properties: 'auto',
		reviver: function() {
			return {};
		}
	},
	{
		name: 'Unknown',
		identifier: function() {
			return true;
		},
		replacer: function(object) {
			throw 'Unknown type: ' + object;
		}
	}
]);

Jason._reference = {};

Jason._reference.windowNatives = ["top", "window", "location", "external", "chrome", "document", "Jason"];

Jason._reference.functionToString = function(convertible) {
	var result = convertible.toString();
    if(Jason._reference.isNativeFunction(convertible)) {
        var index = 0;
        var tempSubstring = '';
        var newResult = '';
        while(tempSubstring != 'function ') {
            tempSubstring += result[index];
            index++;
        }
        tempSubstring = '';
        while(result[index] !== '(') {
            newResult += result[index];
            index++;
        }
        result = newResult;
    }
   	else {
   		result = Jason._reference.stripEnclosure(result);
   	}
    return result;
};

	Jason._reference.stripEnclosure = function(funcStr) {
		var first = funcStr.match(/function\s*[^(]*\(.*\)\s*{/)[0].length;
		var last = funcStr.lastIndexOf('}');
		return funcStr.substring(first, last);
	};

	Jason._reference.isNativeFunction = function(functionToTest) {
	    return  !!functionToTest && (typeof functionToTest).toLowerCase() == 'function' 
	            && (functionToTest === Function.prototype 
	            || /^\s*function\s*(\b[a-z$_][a-z0-9$_]*\b)*\s*\((|([a-z$_][a-z0-9$_]*)(\s*,[a-z$_][a-z0-9$_]*)*)\)\s*{\s*\[native code\]\s*}\s*$/i.test(String(functionToTest)));
	};