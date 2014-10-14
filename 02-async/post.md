# Embracing Async in JavaScript (Part 2)

## Previous posts in this series:

- [Embracing Ascyn in JavaScript (Part
  1)](http://io.pellucid.com/blog/embracing-async-in-javascript-part-1)

## Intro

In the [previous article (part
1)](http://io.pellucid.com/blog/embracing-async-in-javascript-part-1), I
briefly discussed some fundamentals about the JavaScript event loop,
function call stack, closures, and some basic callback patterns.  In
this article, I would like to continue discussing a few more async
patterns in JavaScript.

Before getting into that, I would like to quickly respond to a [comment
from a
Redditor](http://www.reddit.com/r/javascript/comments/2hzu7c/embracing_async_in_javascript_part_1/ckxjauu)
on my previous blog post.  The comment is rejecting the idea that an
entire application must be structured to run asynchronously.  It's a
great comment, and one I definitely do agree with.  In my previous post,
I was not trying to imply that you must structure your entire
application around plain callbacks or other low-level language features
to handle async in your code, but rather that you will quickly encounter
async code in the wild, and you'll need to understand and embrace how it
works, in order to succeed in the JavaScript space.  How you embrace it
is up to you (and what your target platform(s) support), but there are
many resources/libraries/etc. available to help you.  Writing async
code requires more care and language or library support than writing
plain synchronous code, and once you begin to introduce async patterns
into your code, the asynchronicity often proliferates and requires more
and more code to maintain consistency and correct behavior.  JavaScript
at its core does not have great language-level support for async code,
but the situation is improving with new language features, like [native
promises](http://www.html5rocks.com/en/tutorials/es6/promises/), [ES6
generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*),
libraries like [fibers in
Node.js](https://github.com/laverdet/node-fibers), along with hundreds
of existing async modules and libraries in repositories like
[npm](https://www.npmjs.org/search?q=async).

However, in this article, I would still like to stay at a lower level,
and cover two more low-level async coding patterns in JavaScript:
events and promises.

## Events

## Promises

## The future

Generators, etc.

## Conclusion
