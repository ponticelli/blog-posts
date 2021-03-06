# Embracing Async in JavaScript (Part 1)

## Intro

If you've written a non-trivial amount of JavaScript code, you've
probably come to the realization that asynchronous programming is not
just a nice-to-have capability of the language, but a required paradigm,
which must be understood and embraced, in order to take full advantage
of the language and eco-system.

## Callbacks

In JavaScript, one of the most common mechanisms for exposing an
asynchronous API is to use a function that accepts another function as
an argument.  These function arguments are commonly known as callbacks
or callback functions, because they give the primary function a hook
with which to "call back" to you - by invoking the function you provided,
at an appropriate time, or multiple times.  Because JavaScript treats
functions as [first-class
citizens](http://en.wikipedia.org/wiki/First-class_citizen), you can
pass function instances as arguments to other functions, or return
function instances from functions, just as easily as you can pass or
return numbers, strings, booleans, objects, or arrays.  Callback
functions can be invoked by the primary function at any time, any number
of times, synchronously or asynchronously, and using any context binding
and arguments, which creates an extremely flexible and powerful
mechanism for communicating between JavaScript modules.

## JavaScript Event Loop/Call Stack

It's important to have a basic understanding of how the JavaScript
[event loop and function call
stack](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/EventLoop)
work before you get too far with callbacks and async code.  In its most
basic form, JavaScript is a single-threaded runtime, so it does not
support things like multi-threading, multiple processes, nor
inter-process-communication.  Despite the apparent (and actual)
limitations of this, the lack of multi-threading can actually make your
life as a JavaScript developer quite a bit easier, and allows
for interesting types of optimizations within JavaScript
compilation/minification/transpilation tools.

Because there is only a single thread, you will never encounter (nor
have to deal with) common threading challenges like race conditions,
resource contention, thread deadlocks, etc.  When the JavaScript
interpreter begins to execute a chunk of code (e.g. a function call), it
will continue executing that chunk of code until it reaches its
synchronous completion (the end of any synchronous statements contained
in the function).  In the course of executing this synchronous block of
code, any other non-synchronous function invocations (i.e. external
event handler invocations, async function calls, async callbacks, etc.)
are simply queued up for later execution by the runtime event loop.
Once the current function call reaches its synchronous completion, the
event-loop will grab the next chunk of code (function call) off of the
queue and execute that function until it reaches **its** synchronous
completion, and so on.  In this way, you can safely assume that any
sequence of synchronous statements you put together in a function will
always execute to completion, without interruption, before any other
code is executed.  You will also have exclusive access to the CPU until
you yield it (or the runtime kills your apparent blocking code or
infinite loop...).  This can be quite helpful in application
development, but can also require careful consideration and planning,
especially when you need to use async APIs, and the sequencing of your
code matters.

## "Next Tick" or "Next Turn of the Event Loop"

You will often hear JavaScript developers talking about the "next tick"
or "next turn of the event loop".  Generally, these concepts mean that
code will be queued up to execute when the current synchronous code has
completed, and the event loop is ready to grab the next call from its
queue.  All async APIs imply that code will be executed in some later
"tick" or "turn" of the event loop.  The idea of "next tick" may have a
more specific meaning depending on your target JavaScript platform, but
in general, it just means that a function call is enqueued for execution
at a later time.  In this case, the term "later" may or may not imply a
specific time delay, but always implies that code will be deferred until
the current synchronous function execution has completed.

## Non-Blocking Operations

Because JavaScript is single-threaded, it's critical that time-intensive
operations are all non-blocking, and asynchronous, so that these
operations do not block the main application event loop.  When something
blocks in the event loop, no other application logic can run, and the
application tends to grind to a complete halt.  Long running operations
should all be invoked asynchronously, and use some type of async
completion callback when the operation has finished (or failed).  Its
also common to use progress callbacks for long running operations where
incremental progress can be reported (e.g. percentage notifications for
a large file copy operation).  All of these types of callbacks are
simply added to the event queue, and executed in a future turn of the
event loop, so its critical that nothing blocks the event loop at any
time.

## Synchronous vs. Asynchronous Callback APIs

One key aspect of callback APIs is that they can be either synchronous
or asynchronous.  It is often important to understand whether a callback
will be invoked synchronously or asynchronously, because you may have
successive code that should not be executed until after the
callback-based API call has completed.  With synchronous callback-based
APIs, you typically don't need to do anything special to achieve the
desired sequencing, because the callback function will be executed
synchronously to completion, but with async callback APIs, you must
often write your code in a different way to ensure the correct
sequencing of calls.

## Synchronous callback-based "each" function

A synchronous callback-based "each" function is a good example to
illustrate this.  Note: I'm ignoring the topic of callback context
(`this`) and `Function.prototype.call` and `apply` for now.

```js
// Helper function for logging something to the console
function logItem(item) {
    console.log(item);
}

// Synchronous "each" function - invokes the callback for each item
// in the array
function each(arr, callback) {
    for (var i = 0; i < arr.length; ++i) {
        // Invoke the callback synchronously for each iteration
        callback(arr[i]);
    }
}

// Try it out!
console.log("begin");
each([1, 2, 3], logItem); // "logItem" is our "callback" function here
console.log("end");
```

This example will log the following to the console:

```js
begin
1
2
3
end
```

There's nothing really special about this example, other than the fact
that the `for` loop and `each` function call are executed synchronously
to completion before we reach the `console.log("end")` statement.

## Async callback-based "each" function (attempt 1)

An async version of "each" might look like the following.  Here, I'm
using setTimeout to force the execution of the callback to be async.
Note that setTimeout is simply a helper function that enqueues a
function call to be executed at a later time - only after the current
synchronous code has been completed (i.e. the "next turn of the event
loop").  setTimeout also takes a minimum time delay parameter, but here,
I'm just using a delay of 0ms, to force it to be async, but without any
extra delay.

```js
function asyncEach(arr, callback) {
    for (var i = 0; i < arr.length; ++i) {
        // Enqueue a function to be called later
        // Note: this code does not do what we might expect...
        setTimeout(function() {
            callback(arr[i]);
        }, 0);
    }
}

console.log("begin");
asyncEach([1, 2, 3], logItem);
console.log("end");
```

Because the callback functions are being executed asynchronously, you
might expect this code to print this:

```js
begin
end
1
2
3
```

But, surprisingly (or unsurprisingly) it prints the following:

```js
begin
end
undefined
undefined
undefined
```

This is a coding error that has probably tripped-up every JavaScript
developer at one point or another.  What happened here?  Well, because
we used `setTimeout` inside the loop, rather than invoking
`callback(arr[i])` in each iteration, we instead queued up a function
call, to be executed after the completion of the current synchronous
code (i.e. the `for` loop).  In this example, we logged `begin`, queued
up three invocations of the callback function, logged `end`, then
yielded the CPU to the event loop.  The event loop in turn began to
execute our enqueued callback functions, one-by-one, which we hoped
would log the values of `arr[0]`, `arr[1]`, and `arr[2]`.

## JavaScript Scope and Closures

So why did it then print `undefined` three times, rather than `1`, `2`,
`3`?  This gets into another important concept of JavaScript functions
and scoping: the concept of
"[closures](http://en.wikipedia.org/wiki/Closure_(computer_programming))."
When you create a function in JavaScript, the function gets access to
everything in the scope in which the function was created, along with
any new variables you create inside the function.  JavaScript does not
use a "block scope" like C, C++, Java, C#, etc. but instead defines
scope at the function level.  Any variables you declare inside a
function are accessible anywhere else inside that function, or inside
any inner functions.  The interesting aspect of this is that, not only
does a function get access to the full scope of variables in its current
"environmental" scope, but the function instance also "holds onto"
("closes over") this scope for its entire lifetime, even if the parent
(calling) function returns or goes out of scope.  As long as a function
instance is "alive" (is referenced by something, and has not been
garbage collected), it will hold onto this scope, even when
calling functions is long gone.  Because function instances can
be returned from functions, or passed into other functions, a function
can easily live beyond the lifetime of its parent or calling function.
This "holding-onto" of scope can sometimes result in subtle memory
leaks, but we won't go into that here.  In the `asyncEach` example
above, what's happening is: each callback we enqueue inside the `for`
loop captures a reference to the scope environment that existed when the
function was created, and holds onto that scope even when the `for` loop
and `asyncEach` function have exited.  These callback functions live
beyond the lifetime of the `for` loop, because the callback function
instances have been added to the event queue via setTimeout, so the
scope variables like `arr` and `i` remain alive (referenced).  When the
callbacks are finally invoked via the event loop, the callbacks still
have access to variables like `arr` and `i`, but the variable `i` now
has the value of `3`, because the `for` loop had previously executed
synchronously to completion.  In each callback, the `logItem` function
is essentially logging `arr[3]` each time, which is an undefined
index/value in the array `arr`.

There are several ways to address this, but most revolve around adding an
additional function scope around the variables we want to capture for our
callback.

## Async callback-based "each" function (attempt 2)

One way to get the desired value of `i` for each callback is to
introduce an [immediately-invoked function expression
(IIFE)](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
around the variables we want to capture.  An IIFE has several uses, one
of which is to forcefully create a scope, where you wouldn't otherwise
have one (e.g. inside a `for` loop).  [This is not recommended inside
loops](http://jslinterrors.com/dont-make-functions-within-a-loop), but
works:

```js
// Not recommended
function asyncEach2(arr, callback) {
    for (var i = 0; i < arr.length; ++i) {
        // Use an IIFE wrapper to capture the current value of "i" in "iCopy"
        // "iCopy" is unique for each iteration of the loop.
        (function(iCopy) {
            setTimeout(function() {
                callback(arr[iCopy]);
            }, 0);
        }(i));
    }
}

console.log("begin");
asyncEach([1, 2, 3], logItem);
console.log("end");
```

Now we get the expected:

```js
begin
end
1
2
3
```

This works because we've created an inner function scope inside each
iteration of the loop, and we've created a new variable `iCopy` which is
assigned to the value of `i` for each iteration.  `iCopy` is unique for
each iteration of the loop, so we are no longer subject to the issue of
referencing a variable in the outer scope, which changed before we could
get to it.

## Async callback-based "each" function (attempt 3)

A more-preferred way to achieve this is to not use an IIFE inside the
loop, but to create a function outside the loop that creates our
function scope, like so:

```js
function asyncEach3(arr, callback) {
    // Utility inner function to create a wrapper function for the callback
    function makeCallbackWrapper(arr, i, callback) {
        // Create our function scope for use inside the loop
        return function() {
            callback(arr[i]);
        }
    }

    for (var i = 0; i < arr.length; ++i) {
        setTimeout(makeCallbackWrapper(arr, i, callback), 0);
    }
}

console.log("begin");
asyncEach3([1, 2, 3], logItem);
console.log("end");
```

This time, we are using a separate function `makeCallbackWrapper` to
create our function scope for each loop iteration.  This code is
arguably cleaner, easier to read and maintain, and also avoids the "IIFE
inside the loop" performance problem.

## Async callback-based "each" function (attempt 4)

Another "more advanced" way to create a scope inside our `for` loop is
to use function binding or [partial
application](http://en.wikipedia.org/wiki/Partial_application), like
with the native
[Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
function (only available in newer browsers), or one of the many `bind`
implementations provided in libraries like
[Underscore](http://underscorejs.org), [Lo-Dash](http://lodash.com),
[jQuery](http://jquery.org), etc.

Function binding and partial application are larger topics, which can be
convered more in-depth in a future blog post.

```js
function asyncEach4(arr, callback) {
    for (var i = 0; i < arr.length; ++i) {
        // boundCallback is a new function which has arr[i] permanently
        // set (partially applied) as its first argument.  The "null" argument
        // is the binding for the `this` context variable in the callback, which
        // we don't care about in this example...
        var boundCallback = callback.bind(null, arr[i]);
        setTimeout(boundCallback, 0);
    }
}

console.log("begin");
asyncEach4([1, 2, 3], logItem);
console.log("end");
```

## Sequencing of Async Code

But what if we wanted to use one of these `asyncEach` functions but
maintain the sequencing of the log statements, like in the original
synchronous `each` example:

```js
begin
1
2
3
end
```

Maintaining the sequencing of async code will be covered in the next
blog post!

## Wrap-up

This was just a basic intro to callback-based APIs and async programming
in JavaScript.  In a future post, I would like to explore how you might
get the desired sequencing back for the `asyncEach` function, so that we
can still print `begin, 1, 2, 3, end` even when the callback function is
async.  I would also like to discuss other concepts related to async
programming in JavaScript, including how the function context variable
`this` works with callbacks, the concept of "callback hell," and how
**JavaScript promises** can help to clean-up messy async callback code.
