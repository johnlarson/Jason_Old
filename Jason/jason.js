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
 * @see https://github.com/johnlarson/xerxes/blob/master/README
 */

/**
 * Constructs a Jason serializer instance. Because Jason allows for
 * greater customization, stringify and parse are called on instances
 * of Jason to allow for multiple configurations to be used for
 * different tasks in the same webpage. This is different from JSON,
 * in which stringify and parse are always called on the same global
 * object.
 * @param {Object} [options] an object with the following
 * configuration options:
 *   * types: an array containing type objects to be passed into the
 *   addTypes function of the current Jason instance. See the
 *   documentation for Jason.prototype.addTypes for the format of type
 *   objects.
 *   * constants: an array of strings that will be passed into
 *   the addConstants function of the current Jason instance. For more
 *   information, see the documentation for
 *   Jason.prototype.addConstants.
 * @namespace
 * @constructor
 */
function Jason(options) {
	this._table = null;
	for(var i = 0; i < this._typeList.length; i++) {
		this._typeList[i].jason = this;
	}
	for(var option in options) {
		if(option !== 'types' && option !== 'constants' && option !== 'evaluateAfter') {
			if(options.hasOwnProperty(option)) {
				this[option] = options[option];
			}
		}
	}
	if(options) {
		if(options.types) {
			this.addTypes(options.types);
		}
		if(options.constants) {
			this.addConstants(options.constants);
		}
		if(options.evaluateAfter) {
			this.evaluateAfter(options.evaluateAfter);
		}
	}
}

/**
 * Portable access to the global object (window, global). Uses
 * indirect eval.
 * @constant
 */
Jason.GLOBAL = (0, eval)('this');

/**
 * Takes a string that evaluates in the global scope to some variable
 * and returns that variable.
 * @param {string} [name] the input string
 * @returns the variable that `name` evaluates to in the global scope
 */
Jason.reduceToReference = function(name) {
	return name.split(/\./).reduce(function(container, key) {
		if(container) {
			return container[key];
		}
		else {
			throw 'Could not reduce to reference: ' + container + '[' + key + ']';
		}
    }, Jason.GLOBAL);
};

/**
 * Adds types to the list of recognized types for replacement.
 * @param {Array|Object} A type or array of types to add to the
 * current Jason instance's recognized types. The Jason instance keeps a
 * list of recognized types, and for each variable it packages for
 * JSON using the replace method, it runs through the list until it
 * finds a type of which the variable is a member. So, if a variable
 * belongs to more than one type, it will be packaged as the first
 * type in the list that matches it. When you add types to the list
 * using this function, the new types list will be the old types list,
 * concatenated with the list you added, so that the replace function
 * will first try the types you added, in order, and then proceed to
 * try the original types. A type object has the following properties:
 *   * name: a unique name for your type. It is helpful to choose a
 *  name that describes what the type is. One good way of keeping a
 *  name unique and mneumonic is to give it a name that evaluates in
 *  the global scope to the prototype, constructor, or object
 *  associated with the type. For example, there is a type that comes
 *  with the library that deals with Events, and its name is 'Event'.
 *   * identifier: a function that returns true if the variable passed
 *  passed into it is a member of the current type. It has the
 *  parameters (object, key, parent), where object is the variable,
 *  key is the key that it was found by, and parent is the object
 *  for which parent[key] === object. Obviously, since you are the one
 *  writing the function, these parameters are optional.
 *   * replacer: a function that turns the object into something that
 *  JSON can stringify. For most objects that have a collection of
 *  properties to iterate through and package for JSON, you don't need
 *  to worry about the properties in this function, just about things
 *  that can't be dealt with by iterating through properties, or
 *  which, if they were iterated through in this manner, would take
 *  too long. However, if you choose not to use the 'properties', you
 *  can deal with an object's properties in the 'replacer' function.
 *  If no replacer is specified, then no object is passed into the
 *  reviver function. Takes the parameters (object, key, parent) (see
 *  point on the identifier function).
 *   * properties: (optional) a function that chooses the properties
 *  that will be stringified from an object, or the string 'auto'. In
 *  most cases, you can just use the string 'auto', but for unusual
 *  cases, using a function is an option. If properties is
 *  not specified, the Jason instance will not try to iterate through
 *  properties to package them for JSON. Takes parameters
 *  (object, key, parent) (see point on the identifier function).
 *   * reviver: takes the object you packaged for JSON and returns it
 *  to its original form. Takes the parameters (object, key, parent).
 *  `object` is the restored object. `parent` is the restored object
 *  that `object` is currently being checked as a child of. `key` is
 *  the string such that `parent[key] === object`. If `properties`
 *  property is specified, you don't need to worry about
 *  reviving non-atomic data from the packaged object. That is done
 *  automatically for you.
 * @method
 */

Jason.prototype.addTypes = function(obj) {
	if(obj instanceof Array) {
		for(var i = 0; i < obj.length; i++) {
			this._typeDict[obj[i].name] = obj[i];
		}
		this._typeList = obj.concat(this._typeList);
	}
	else {
		this._typeDict[obj.name] = obj;
		this._typeList.unshift(obj);
	}
};

Jason.prototype.addType = function(obj) {
	this.addTypes(obj);
};
	
	Jason.prototype._typeDict = {};

	Jason.prototype._typeList = [];

/**
 * Adds constants to the current Jason instance's list of known
 * constants.
 * @param {Array|string} [obj] A string or array of strings. Each
 * string evaluates in the global scope to some value that you want to
 * be treated as a constant. For example, the global constant
 * `undefined`, or some object in your webpage that will always be in
 * the same state but is referenced in an object you are stringifying.
 * @method
 */
Jason.prototype.addConstants = function(obj) {
	if(obj instanceof Array) {
		for(var i = 0; i < obj.length; i++) {
			var key = obj[i];
			try {
				this._constants[key] = Jason._getConstantValue(key);
			}
			catch(err) {}
		}
	}
	else {
		try {
			this._constants[obj] = Jason._getConstantValue(obj);
		} catch(err){}
	}
};

Jason.prototype.addConstant = function(obj) {
	this.addConstants(obj);
};

	Jason.prototype._constants = {};

	Jason._getConstantValue = function(str) {
		try {
			return Jason.reduceToReference(str);
		}
		catch(err) {
			Jason.evaluateAfter(str);
		}
	}

		Jason._EVALUATE_AFTER = {};

/**
 * Adds a special type of constant that doesn't have to exist at the
 * time of adding the constant or at the time of replacing the object,
 * but must exist at the time the object is revived. This comes with
 * a performance cost.
 * @param {Array|string} [obj] An 'evaluate-after' string or array of
 * strings that represent the objects they evaluate to in the global
 * scope.
 * @method
 */
Jason.prototype.evaluateAfter = function(obj) {
	if(obj instanceof Array) {
		this._evaluateAfterList = obj.concat(this._evaluateAfterList);
	}
	else {
		this._evaluateAfterList.unshift(obj);
	}
};

	Jason.prototype._evaluateAfterList = [];

/**
 * Returns a string that the current Jason instance can rebuild into
 * a clone of the original object.
 * @param [object] The variable to be turned into a string
 * representation.
 * @param {(Function|Array)} [preReplacer] (optional) If a function,
 * it is called for each object that is visited by the Jason instance,
 * before it is packaged for JSON. Takes the parameters
 * (key, object, parent), where `object` is the object being
 * stringified, `parent` is the object that `object` is being viewed
 * as a child of, and `key` is the string such that
 * `parent[key] === object`. If an array, only the properties
 * corresponding to the keys in the array will be packaged and
 * stringified. It's less powerful than `Jason.prototype.addTypes`,
 * but it is convenient for people who are used to the api for JSON.
 * @param {(string|number)} [space] Exactly the same as the `space`
 * parameter in JSON.stringify.
 * @returns a string representation of `object` that the current Jason
 * instance can parse into a clone of `object`.
 * @method
 */
Jason.prototype.stringify = function(object, preReplacer, space) {
	var preparedObject = this.replace(object, preReplacer);
	return JSON.stringify(preparedObject, undefined, space);
};
	
	/**
	 * Packages a variable for JSON. This is useful for use with other
	 * libraries that use JSON-able objects as input and output.
	 * @param [object] The variable to be packaged for JSON.
	 * @param {(Function|Array)} [preReplacer] See documentation for
	 * `preReplacer` parameter of `Jason.prototype.stringify`.
	 * @returns a representation of `object` that JSON can stringify.
	 * @method
	 */
	Jason.prototype.replace = function(object, preReplacer) {
		this._tempReplacer = preReplacer;
		this._table = [];
		this.visit(object, '');
		for(var i = 0; i < this._table.length; i++) {
			this._table[i].original = undefined;
		}
		var table = this._table;
		this._table = null;
		this._tempReplacer = null;
		return table;
	};
		/**
		 * The recursive function used inside
		 * `Jason.prototype.replace`. Sometimes useful inside replacer
		 * functions in type objects.
		 * @param [object] The variable to be packaged for JSON and
		 * placed in the table.
		 * @param {string} [key] In the current parent object, the key
		 * that points to `object`.
		 * @param [parent] The current parent object that `object` is
		 * being viewed as a child of.
		 * @returns a representation of `object` that JSON can
		 * stringify.
		 * @method
		 */
		Jason.prototype.visit = function(object, key, parent) {
			if(key !== '') {
				object = this._preReplace(key, object, parent);
			}
			if(Jason._isJSONAtom(object)) {
				return object;
			}
			for(var i = 0; i < this._typeList.length; i++) {
				var type = this._typeList[i];
				if(type.identifier(object, key, parent)) {
					return this._packObject(object, key, parent, type);
				}
			}

		};

			Jason.prototype._preReplace = function(key, value, parent) {
				if(typeof this._tempReplacer === 'function') {
					return this._tempReplacer(key, value, parent);
				}
				else if(this._tempReplacer instanceof Array) {
					if(this._tempReplacer.indexOf(key) !== -1) {
						return value;
					}
					else {
						return undefined;
					}
				}
				else {
					return value;
				}
			};
			
			Jason.prototype._packObject = function(object, key, parent, type) {
				var result;
				if(type.storage && type.storage === 'value') {
					result = this._packValue(object, key, parent, type, false);
				}
				else {
					result = this._ref(object, key, parent, type);
				}
				return result;
			};

				Jason.prototype._ref = function(object, key, parent, type) {
					var index = this._getIndexInTable(object);
					if(index === -1) {
						index = this._table.length;
						var packedObject = this._packValue(object, key, parent, type, true);
					}
					return {
						jason$lib$type: 'ref',
						ref: index
					};
				};

				Jason.prototype._packValue = function(object, key, parent, type, addToTable) {
					var typeName = type.name;
					var packedObject = {
						jason$lib$type: typeName,
						original: object
					}
					if(addToTable) {
						this._table.push(packedObject);
					}
					if(type.replacer) {
						packedObject.self = type.replacer(object, key, parent);
					}
					var properties;
					if(type.properties === 'auto') {
						properties = object;
					}
					else if(typeof type.properties === 'function') {
						properties = type.properties(object, key, parent);
					}
					if(properties) {
						packedObject.prototype = this.visit(object.__proto__, '__proto__', object);
						packedObject.properties = this._packProperties(properties);
					}
					return packedObject;
				};

					Jason.prototype._getIndexInTable = function(object) {
						for(var i = 0; i < this._table.length; i++) {
							if(this._table[i].original === object) {
								return i;
							}
						}
						return -1;
					};

				Jason.prototype._packProperties = function(container) {
					var storage;
					if(container instanceof Array) {
						storage = [];
						for(var i = 0; i < container.length; i++) {
							storage[i] = this.visit(container[i], i, container);
						}
					}
					else {
						storage = {};
					}
					for(key in container) {
						if(container === kitsu.desk) {
							var a = 12;
						}
						if(container.hasOwnProperty(key)) {
							storage[key] = this.visit(container[key], key, container);
						}	
					}
					return storage;
				};

/**
 * Parses a string to build the object it represents.
 * @param {string} [text] The text to be parsed.
 * @param {function} [postReviver] Takes the parameters
 * `(key, object, parent)`, where object is the object parsed and
 * revived from `text`, `parent` is the revived object that `object`
 * is being viewed as a child of, and `key` is the string such that
 * `parent[key] === object`. Called after an object has been rebuilt
 * to turn it into whatever you want to turn it into. Not as powerful
 * as `Jason.prototype.addTypes, but convenient for people who are used
 * to the JSON api.
 * @returns a clone of the object represented by `text`.
 * @method
 */
Jason.prototype.parse = function(text, postReviver) {
	var data = JSON.parse(text);
	return this.revive(data, postReviver);
};
	
	/**
	 * Takes an object that has been packaged for JSON by the current
	 * Jason instance and rebuilds it into its original form. This is
	 * useful for working with other libraries that use JSON-able
	 * objects as input and output.
	 * @param [data] The object that has been packaged for JSON.
	 * @param [postReviver] (See `postReviver` parameter in
	 * `Jason.prototype.parse).
	 * @returns a clone of the original object represented by `data`.
	 */
	Jason.prototype.revive = function(data, postReviver) {
		this._tempReviver = postReviver;
		this._table = data;
		this._completedTable = [];
		for(var i = 0; i < data.length; i++) {
			this._completedTable.push(Jason._EMPTY_SLOT);
		}
		var root = this._unpack(this._table[0], '', null);
		this._table = null;
		this._tempReviver = null;
		return root;
	};

		Jason._EMPTY_SLOT = {};

		Jason.prototype._unpack = function(object, key, parent) {
			var result;
			if(object && object.jason$lib$type) {
				if(object.jason$lib$type === 'ref') {
					result = this._deref(object, key, parent);
				}
				else {
					result = this._unpackValue(object, key, parent);
				}
			}
			else {
				result = object;
			}
			if(typeof this._tempReviver === 'function') {
				result = this._tempReviver(key, result, parent);
			}
			return result;
		};

			Jason.prototype._deref = function(object, key, parent) {
				var index = object.ref;
				if(this._completedTable[index] !== Jason._EMPTY_SLOT) {
					return this._completedTable[index];
				}
				else {
					var toUnpack = this._table[index];
					return this._unpackValue(toUnpack, key, parent, index);
				}
			};

			Jason.prototype._unpackValue = function(object, key, parent, tableIndex) {
				var type = this._typeDict[object.jason$lib$type];
				var result;
				if(object.self) {
					result = type.reviver(object.self, key, parent);
				}
				else {
					result = type.reviver(undefined, key, parent);
				}
				if(tableIndex) {
					this._completedTable[tableIndex] = result;
				}
				if(object.prototype) {
					result.__proto__ = this._unpack(object.prototype, '__proto__', result);
				}
				if(object.properties) {
					var ownProperties = Object.getOwnPropertyNames(object.properties);
					for(var i = 0; i < ownProperties.length; i++) {
						var key = ownProperties[i];
						result[key] = this._unpack(object.properties[key], key, result);
					}
				}
				return result;
			};

Jason._isJSONAtom = function(object) {
	return	object === null ||
			typeof object === 'number' ||
			typeof object === 'string' ||
			typeof object === 'boolean'
			;
};