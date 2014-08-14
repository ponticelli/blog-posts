# Embracing Async Code with JavaScript Promises

If you've written a non-trivial amount of JavaScript code, you've
probably come to realize that async support is not just a nice-to-have
capability of the language, but a required paradigm that must be
understood and embraced in order to fully take advantage of the language
and eco-system.

In JavaScript, the most common mechanism for exposing an asychronous API
is the callback function.  Because JavaScript treats functions as
first-class-citizes (e.g. they are objects just like everything else),
you can pass a function into another function, just as easily as you can
pass a number, string, boolean, object or array into a function.  By
passing a function into another function, it allows the other function
to invoke your code at some point in its lifetime, which provides a
mechanism to inject some custom code into some larger routine or
algorithm.  It's called a "callback" because you make a call to a
function by passing in your function, and then the other function can
make a "call back" to you by invoking your function at some later time.

It's important to have at least a basic understanding of how the
JavaScript event loop and call stack works before you get too far with
callbacks/async code.  In its most basic form, JavaScript is a
single-threaded runtime, so it does not support things like
multi-threading or multiple processes and inter-process-communication.
Despite the apparent limitations of this, it can actually make your life
easier in many ways.  Since there is only a single thread, you can never
run into the typical threading issues, like race-conditions, resource
contention, deadlocks, etc.  When the JavaScript interpreter begins to
execute some chunk of code (e.g. a function call), it will continue
executing that synchronous chunk of code until it reaches its completion
and yields the CPU.  In the course of executing this synchronous block
of code, any other code (i.e. functions) that need to be executed are queued up in a
call-stack.  Once the current function call reaches its completion, the
event-loop will get the next block of code (function call) off of the call stack and
start executing that until it completes, and so on.  In this way, you
can safely assume that any sequence of synchronous statements you put
together in a function will always execute to completion before any
other code is run.

One key aspect of callback APIs is that they can be either synchronous
or asynchronous.  It is often important to understand whether an API is
synchronous or asynchronous, because you may have code the should not be
executed until after the callback method has completed.  With
synchronous callback APIs, you typically don't need to do anything
special, but with async callback APIs, you probably do need to do
something special.

A callback-based "each" function is a good example to illustrate:

```js
// Invoke the callback for each item in the array argument.  This is
// done inside a synchronous for-loop.

function each(arr, callback) {
    for (var i = 0; i < arr.length; ++i) {
        callback(arr[i]);
    }
}

function logItem(item) {
    console.log(item);
}

console.log("begin");

// Call the function
each([1, 2, 3], logItem);

console.log("end");
```



