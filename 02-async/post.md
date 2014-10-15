# Embracing Async in JavaScript (Part 2)

## Previous posts in this series:

- [Embracing Async in JavaScript (Part
  1)](http://io.pellucid.com/blog/embracing-async-in-javascript-part-1)

## Intro

In the [previous article (part
1)](http://io.pellucid.com/blog/embracing-async-in-javascript-part-1), I
briefly discussed some fundamentals about the JavaScript event loop,
function call stack, closures, and some basic callback patterns, as they
relate to async programming.  In this article, I would like to continue
discussing a few more async topics in JavaScript.

Before getting into that, I would like to quickly respond to a [comment
from a
Redditor](http://www.reddit.com/r/javascript/comments/2hzu7c/embracing_async_in_javascript_part_1/ckxjauu)
on my previous blog post.  The comment is rejecting the idea that an
entire application must be structured to run asynchronously.  It's a
great comment, and one I definitely do agree with.  In my previous post,
I was not trying to imply that you must structure your entire
application around plain callbacks or other low-level language features
to handle async APIs in your code, but rather that you will quickly encounter
async code in the wild, and you'll need to understand and embrace how it
works, in order to succeed in the JavaScript space.  How you embrace it
is up to you (and what your target platform(s) support), but there are
many resources/libraries/etc. available to help you.  Writing async code
requires more care and language/library support than writing plain
synchronous code, and once you begin to introduce async patterns into
your code, the asynchronicity often proliferates and requires more and
more code to maintain consistency and correct behavior.  JavaScript at
its core does not have great language-level support for async code, but
the situation is improving with new language features, like [native
promises](http://www.html5rocks.com/en/tutorials/es6/promises/), [ES6
generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*),
libraries like [fibers in
Node.js](https://github.com/laverdet/node-fibers), along with hundreds
of existing async modules and libraries in repositories like
[npm](https://www.npmjs.org/search?q=async).

However, in this article, I would still like to stay at a lower level,
and cover two more low-level async coding patterns in JavaScript: events
and promises.

## Events

Events in JavaScript are a publish-subscribe (pub-sub) mechanism for
communicating between JavaScript objects.  The idea with events is
similar to callbacks - the publisher of an event provides a way for
interested parties to subscribe to receive notifications when an event
occurs.  Subscribing to an event typically means registering a callback
function to be invoked by the publisher when the event occurs.  When the
event occurs, the publisher simply invokes any registered callbacks.
Like callbacks, events can occur synchronously or asynchronously, and
the event listener callbacks can be invoked synchronously or
asynchrounously.

Events are used natively by JavaScript for things like DOM events, like
clicks, mouse movements, form submissions etc.  Even in non-browser
JavaScript, events are used widely, like with Node.js's
[EventEmitter](http://nodejs.org/api/events.html).  In Node.js, events
also appear in things like [streams](http://nodejs.org/api/stream.html).

The main benefit of using events is that they can be consumed by
multiple listeners.  When an event occurs, the publisher of the event
can invoke multiple registered callbacks, so multiple objects can be
notified.  It also creates loose coupling between components, because
the publisher should not care what, or how many consumers are
subscribed, and the subscribers do not need to have intimate knowledge
of what the publisher is doing internally.

Most larger JavaScript frameworks (browser or non-browser) support some
type of eventing, including
[jQuery](http://api.jquery.com/category/events/),
[AngularJS](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$on),
[Backbone](http://backbonejs.org/#Events),
[React](http://facebook.github.io/react/docs/events.html),
[Ember](http://emberjs.com/guides/views/handling-events/), and as
mentioned before, Node.js, with many varieties of `EventEmitters` and
`streams`.

Events are a useful synchronous or asynchronous communication mechanism,
but they do not inherently help to solve the problem of the sequencing
of async calls.  You can however use other techniques to help with this,
like you can with callbacks.

## Promises

Promises are another mechanism for dealing with asynchronous
communication between JavaScript objects.  Promises have become quite
popular in JavaScript in the past few years, and there are many Promise
implementations available now, including an upcoming native [Promise
implementation in ECMAScript
6](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

Promises are similar to callbacks in that they can be used to notify
other components when an async task has completed or failed, but the way
this is accomplished is a bit different than callbacks or events.  With
callbacks, an async API function accepts one or more function arguments,
which the API function can invoke when some task has completed or
failed; whereas, a Promise-based function does not accept callback
arguments, but instead returns an `promise` object which other
components can use to register completion or failure callbacks.

When talking about promises, there is some very specific terminology
involved, which is outlined in the [Promises/A+
spec](https://promisesaplus.com/).  There are other promise specs
available too, but Promises/A+ seems to be one of the more (most)
popular ones.  There are many Promise tutorials available around the
internet, so I won't go into a tutorial here, but I did want to provide
a quick example on how promises can be used to sequence async function
calls.  I'll use the powerful and popular promise library
[Q](https://github.com/kriskowal/q) for the example.

This is a very contrived example, but demonstrates how sequencing of
async calls can work with promises:

```js
function begin() {
    console.log("begin");
    return 0;
}

function end() {
    console.log("end");
}

function incrementAsync(i) {
    var defer = Q.defer();

    setTimeout(function() {
        i++;
        console.log(i);
        defer.resolve(i);
    }, 0);

    return defer.promise;
}

Q.fcall(begin)
    .then(incrementAsync)
    .then(incrementAsync)
    .then(incrementAsync)
    .then(end);
```

This example outputs the following to the console:

```
begin
1
2
3
end
```

The main driver of this is example is the Q promise chain, started by
the invocation of `Q.fcall` with the `begin` function argument.
`Q.fcall` is a static method provided by Q that executes the provided
function, and returns a promise of a value.  The argument function can
either return a promise value or a non-promise value, but either way, Q
will return a promise from `Q.fcall`.  Because `Q.fcall` always returns
a promise, you can chain methods onto the promise using the `then`
function, which is the cornerstone method of promise APIs.  Methods that
return a promise are often said to be "thenable," which means you can
chain on callbacks using `.then()`.

The first `.then` above chains the `incrementAsync` function to the
promise created by `Q.fcall(begin)`.  The `incrementAsync` function
takes a numeric argument, sets a timeout to increment the value
asynchronously, then returns a promise for the incremented value.  The
`incrementAsync` method creates a Q `deferred` object (using
`Q.defer()`), which is the object that the "producer" of a promise deals
with.  The producer of a promise is responsible for either fulfilling,
or rejecting the promise at some point, typically when an async call
succeeds or fails.  In Q, the this is done by calling either
`.resolve()` or `.reject()` on the deferred object.  In
`incrementAsync`, the promise is fulfilled by calling incrementing i,
then calling `.resolve(i)`, which indicates that the promise is
fulfilled, and provides a value to pass to the next function in the
chain.  The value passed to `.resolve()` is passed to the next function
in the chain as the first argument to that function.  Each method in the
Q promise chain can either return a promise for a value or a plain
value, and Q will execute the chain in sequence, based on when each
successive fulfillment or rejection.  Promises do not need to be
fulfilled with a value - they can simply be fulfilled with no value to
indicate that an async operation succeeded, but there is no value to
provide.

The Promises/A+ spec requires that promises are always resolved
asynchronously, so the `setTimeout` in the example above is actually
redundant, and only used to emphasize the async nature of
`incrementAsync`.

Promises are a somewhat complex topic, which is difficult to fully cover
in one blog post, but there are numerous resources available for further
learning.

## The future

JavaScript is rapidly evolving as a language and ecosystem.  There are
many exciting new language features coming, to aid with async code.  One
of the most exciting features is [ES6
generators](http://davidwalsh.name/es6-generators), which are an
extremely powerful and new way to program in JavaScript.  I will not get
into this topic now, but there are many good tutorials and guides
available around the internet.

## Conclusion

Async programming is an important concept to grasp in JavaScript, and
there are many different ways to embrace it.  There is no correct
answer in how to deal with async code, but it's important to understand
the different options available, so you can choose the right solution for
your needs.
