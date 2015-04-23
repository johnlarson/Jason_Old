# Jason

It's... kind of like JSON...

Jason is an advanced javascript serialization library that aims to be able to serialize all possible javascript variables. It has the following advantages over plain JSON:

 * Serializes circular references
 * Serializes prototypes
 * Serializes types that plain JSON does not

It is supported on:

 * Chrome
 * Firefox
 * Opera
 * Internet Explorer 11+

Jason can serialize the following types of values:

 * boolean
 * string
 * number
 * Array
 * Boolean object
 * String object
 * Number object
 * Date
 * RegExp
 * null
 * undefined
 * NaN
 * Infinity
 * -Infinity
 * information about dynamically created properties of the window (for in-brower javascript)
 * function
 * DOM Element
 * Event
 * Other Objects, except immutable ones.

Jason can't do the following (yet?):

 * immutable objects: Immutable objects can't be serialized unless you add a custom type to deal with them. Some of these types are common and so have been added to the library. Others, however, require some customization.
 * Closures: I have not found a way to get into javascript closures. This is by design, and there may not be a way around it. However, if you know one, I would love to hear it.

If there is anything that Jason does not correctly serialize or a javascript environment in which it doesn't work properly, email me at john.robert.larson@gmail.com so I can fix it. I also welcome pull requests; it is much easier for me extend and debug Jason when I'm not entirely on my own.

## Basic Usage:

Jason has an api similar to JSON:

```javascript
var myObject = new SomeObjectTypeFromALibraryOrSomething();
var jason = new Jason();
var myObjectString = jason.stringify(myObject);
var myObjectCopy = jason.parse(myObjectString);
```

It even allows for JSON-like replacer, space, and reviver parameters:

```javascript
var myObject = new SomeType();
var jason = new Jason();
var myObjectString= jason.stringify(myObject, someReplacer, someSpace);
var myObjectCopy = jason.parse(myObjectString, someReviver);
```

Jason's `stringify` function makes necessary replacements to prepare the object for JSON, then calls `JSON.stringify` on the object. To prepare the object without stringifying it, use the `replace` method. After that, you can use the `revive` method to rebuild it into a copy of the original:

```javascript
var jason = new Jason();
var myObjectJSONable = jason.replace(myObject);
var myObjectString = JSON.stringify(myObjectJSONable);
var myObjectJSONCopy = JSON.parse(myObjectString);
var myObjectCopy = myObject.revive(myObjectJSONCopy);
```

These methods also allow for a JSON-like replacer and reviver:

```javascript
var jason = new Jason();
var myObjectJSONable = jason.replace(myObject, someReplacer);
var myObjectCopy = jason.revive(myObject, someReviver);
```

You could even use it to clone objects:

```javascript
var jason = new Jason();
var myObjectClone = jason.revive(jason.replace(myObject));
```

Of course, you may need to customize your Jason instance in order to control where deep copies and shallow copies of properties are made. See the 'Customization' section for more information on that.

## Customization

It may seem strange to call a replacer function where one of the parameters is another replacer function. That's because it is strange! Both replacers serve basically the same purpose. The replacer parameter is completely unnecessary; it's just there for convenience, since many people are already familiar with the JSON api. You can customize your Jason instance's `replace` and `revive` functions using the addTypes method:

```javascript
var jason = new Jason();
jason.addTypes([
	{
		name: 'some type name',
		identifier: function(object, key, parent) {
			return true;
		},
		replacer: function(object, key, parent) {
			return something;
		},
		reviver: function(JSONObject, key, parent) {
			return somethingElse;
		}
	},
	{
		//...Some other type here.
	},
	{
		//...Some other type here.
	},
	...
]);
```

The `name` property is a unique name you choose for the type. The `identifier` is the function that determines whether a given object is of the current type, the `replacer` is a function that returns a JSON representation of an object of that type, and the `reviver` is a function that takes that JSON representation and returns a rebuilt copy of the original.

Here's an example type object comes built in to Jason:

```javascript
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
}
```

There is also an optional shortcut property called `properties`. `properties` is a function that returns an array or object containing JSON representations of the properties of the original object. However, in most cases, you don't need to write your own custom `properties` function; if you want all the properties of the object being replaced/revived, you can just set `properties` to `'auto'`. If you use `properties`, you don't need to deal with the properties in the `replacer` or `reviver` functions. Here is an example type object that comes built in to Jason that uses `properties` (it doesn't have a `replacer` function because, in this case, all information necessary to rebuild it is packaged by the `properties` setting):

```javascript
{
	name: 'Object',
	identifier: function(object) {
		return object instanceof Object;
	},
	properties: 'auto',
	reviver: function() {
		return {};
	}
}
```

Also, if you wish to reference some aspect of the current Jason instance in any of these functions, you may use `this.jason`.


Another useful function for customization is the `addConstants` method. It is used to add references to variables without saving their state.

```javascript
var jason = new Jason();
jason.addConstants([
	'myHtmlElement',
	'myObjectThatIsReferencedButWhoseStateIDontWantToChangeWhenIRevive'
]);
```

Each constant added must exist at the time it is added to the current Jason instance. If this is simply not possible, or if you just want to be sure and don't care about a performance loss, you can also use the `evaluateAfter` method:

```javascript
var jason = new Jason();
jason.evaluateAfter([
	'myHtmlElement',
	'myObjectThatIsReferencedButWhoseStateIDontWantToChangeWhenIRevive'
]);
```

As you can see, the api for this function is exactly the same as for the `addConstants` method. The difference is that the `addConstants` function evaluates the constants, whereas constants added with `evaluateAfter` are not evaluated until `Jason.prototype.revive` is called.

You can also add types and constants in the `Jason` constructor:

```javascript
var jason = new Jason({
	types: [
		{
			...
		},
		{
			...
		},
		...
	],
	constants: [
		'myHtmlElement',
		...
	],
	evaluateAfter: [
		'someObject',
		'someOtherObject',
		...
	]
});

Jason uses the same customization api to add types internally, so you now know enough to contribute to Jason.

## Contributing to Jason

If you would like to contribute to Jason, pull requests are welcome. You can add types using the same customization api you use to customize your own instance. The base code (excludes code to add types and constants) for Jason is carefully organized and is just over 500 lines long with the api documentation included. I also would love to refactor any JSON-style replacer and reviver functions for the Jason library. Also, it is even helpful to just let me know if something is broken so I can fix it. Pull requests should involve adding functionality for types that exist natively in browsers, nodejs, or other javascript environments. Adding functionality for a specific library should be a separate project. Jason is very pluggable, so dividing things in this way shouldn't be too hard.

## Email me if something breaks!

Jason is still in alpha. I use it on my own projects, but there is no gaurantee it will work out of the box for you. Please let me know if there are things that Jason can't handle, and I will try to fix those. Also, Jason is designed to be easy to contribute to, so if you've used the `addTypes` and/or `addConstants`/`evaluateLater` functions to solve your problems, let me know; your code will transfer very easily to the library itself. Even if you just used the JSON-like pre-replacer and post-reviver, I would love to refactor your code to fit the style of the library and add it in. You can reach me at john.robert.larson@gmail.com.

## Current To-Do List

Here my list of to-do's for Jason, in order of priority. Let me know if you think something should be added to the list or if something on the list needs to be a higher priority.

 * Create a function that takes a namespace object as a parameter and automatically calls addConstant on all associated variables.
 * Add shortcuts that allow people to type short strings instead of full functions in type objects.
 * Change the way Jason handles DOM elements so that it finds the topmost parent of each stringified DOM element and stringifies information about that and its contents, in order to keep consistency with placement of elements within other elements.
 * Design and implement a more elegant and/or faster way to stringify functions.
 * Add configuration presets that automatically configure the Jason instance so that users can configure the Jason instance match their needs and priorities without having to think too much about the configuration. (Like a 'time-efficient' preset, a 'memory-efficient' preset, etc.)
 * Add specific types of Events to the library's type list so that it can deal with Events more quickly (The generalized version saves a lot of properties of the Event that are not used when it is rebuilt).