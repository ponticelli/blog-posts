# Embracing Async Code in JavaScript

If you've written a non-trivial amount of JavaScript code, you've
probably come to realize that async support is not just a nice-to-have
capability of the language, but a required paradigm that must be
understood and embraced, in order to fully take advantage of the language
and eco-system.

In JavaScript, the most common mechanism for exposing an asychronous API
is to use a callback function.  Because JavaScript treats functions as
first-class-citizes (e.g. they are objects just like everything else),
you can pass functions as arguments to other functions, just as easily
as you can pass numbers, strings, booleans, objects or arrays as
arguments to functions.  By passing a function into another function, it
allows the other function to invoke your code at some point in its
lifetime, which provides a mechanism for you to inject some custom code
into some larger routine or algorithm.  It's called a "callback" because
you make a call to a function by passing in your function, and then the
other function can make a "call back" to you by invoking your function
at some later time.

It's important to have at least a basic understanding of how the
JavaScript event loop and function call stack works before you get too
far with callbacks and async code.  In its most basic form, JavaScript
is a single-threaded runtime, so it does not support things like
multi-threading, multiple processes, nor inter-process-communication.
Despite the apparent (and actual) limitations of this, the lack of
threading can make your life easier in many ways.  Because there is only
a single thread, you will never encounter, nor have to deal with, the
typical threading challenges like race-conditions, resource contention,
deadlocks, and things like that.  When the JavaScript interpreter begins
to execute a chunk of code (e.g. a function call), it will continue
executing that chunk of code until it reaches its synchronous completion
(the end of any synchronous statements inside the function).  In the
course of executing this synchronous block of code, any other
non-synchronous function invocations (i.e.  event handlers, async
function calls, async callbacks, etc.) are queued up for later
execution.  Once the current function call reaches its completion, the
event-loop will yank the next block of code (function call) off of the
queue and start executing that until it reaches the completion of that
function, and so on.  In this way, you can safely assume that any
sequence of synchronous statements you put together in a function will
always execute to completion before any other code is run, and you will
have exclusive access to the CPU until you give it up.  In other words,
your syncrhonous code will never be interrupted.  This can be quite
helpful in application development, but can also require some careful
consideration.

One key aspect of callback APIs is that they can be either synchronous
or asynchronous.  It is often important to understand whether a function
is synchronous or asynchronous, because you may have successive code
that should not be executed until after the callback-based function has
been completed.  With synchronous callback-based APIs, you typically don't
need to do anything special, because the callback function will be
executed synchronously to completion, but with async callback APIs, you
must often write your code in a different way to ensure the correct
sequencing of operations.

A synchronous callback-based "each" function is a good example to
illustrate this:

```js
/**
 * each
 * Invokes the callback for each item in the array argument.  This is
 * done inside a synchronous for-loop, so the callback will be invoked
 * for each item before the each function returns.
 */
function each(arr, callback) {
    for (var i = 0; i < arr.length; ++i) {
        callback(arr[i]);
    }
}

/**
 * logItem
 * Logs an item using console.log
 * (this is our callback function)
 */
function logItem(item) {
    console.log(item);
}

console.log("begin");

// Invoke the synchronous callback-based each
each([1, 2, 3], logItem);

console.log("end");
```

This example will log the following to the console, as you might expect:

```js
begin
1
2
3
end
```

An async version of "each" might look like this (using setTimeout to force
the execution of the callback to be async).  Note that setTimeout is
simply a helper function that enqueues a function to be executed
sometime later, and only after the current synchronous code has been
finished.

```js
function asyncEach(arr, callback) {
    for (var i = 0; i < arr.length; ++i) {
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
developer at some point or another.  What happened here?  Well, because
we used setTimeout inside the loop, in each iteration of the loop,
rather than invoking callback(arr[i]), we just queued up
function calls in the runtime event queue, to be executed whenever the
current synchronous code has completed.  In this example, we logged
"begin", queued up 3 invocations of the callback, then logged "end".

So why did it print undefined three times, rather than 1, 2, 3?  This
gets into another important concept of JavaScript functions and scoping
- the concept of "closures."  When you create a function in JavaScript,
  the function body gets access to everything in its current scope.
JavaScript does not use a block scope like C, C++, Java, C#, etc. but
instead defines the scope at the function level.  Any variable you
declare inside a function is accessible anywhere else inside that
function, or inside any inner functions.  The interesting aspect of this
is that, not only does a function get access to the full scope of
variables in its current "environmental" (outer) scope, but the function
also holds onto this full scope environment, even if the parent
(calling) function returns or goes out of scope.  This is a poor
explanation of scope and closures, but in the asyncEach example above,
what's happening is that each callback we queue up inside the for loop
captures a reference to the scope that existed when the function was
created, and holds onto that scope even when the for loop and asyncEach
function exit.  When the callbacks are finally invoked by the event
loop, they still have access to variables like arr and i, but the value
of the i variable is not what we might expect.  Since the for loop
executes synchronously, the value of i is incremented from 0 to 3 before
the loop terminates.  When the callback functions are finally run from
the event queue, they still have a reference to i, but the value of i
has already been incremented to 3, so when logItem tries to log arr[i],
it gets undefined in each case.

There are several ways to fix this, but most resolve around adding an
additonal function scope to make sure you capture the correct value of i
inside the loop.

```js
function asyncLogItem(item) {
    setTimeout(function() {
        console.log(item);
    }, 0);
}

console.log("begin");
asyncEach([1, 2, 3], asyncLogItem);
console.log("end");
```

This works because we've introduced
