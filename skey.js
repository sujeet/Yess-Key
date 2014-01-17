/*
  CS255 - Winter 2014
  Assignment 1: S/KEY Authentication

  SUNet ID #1: aparnak
  SUNet ID #2: sujeet

1. Briefly describe your implementation and its design choices.
   e.g. What algorithm did you use? How did you structure your code?
   Did you do something interesting in "save" and "load"?
   Justify the space/time used by your implementation.
-->
 ALGORITHM:
   The algorithm was guided by the hint given in the problem sheet.
   We started off with the pebble structure mentioned in the hint.
   "log(n) space" was what guided the design of the algorithm.
   We tried to answer the question
   "Now that m number of pebbles have been discarded, how to use the space
    that was used up by them?"
   Example:
   initial pebbles : [1 129 193 225 241 249 253 255 256
   current pebbles : [1 129 193 225 241 249
   want to find    : hash at 249
   We have it at the top of the stack, get it, pop.
   current pebbles : [1 129 193 225 241
   want to find    : hash at 248
   We have 4 places freed up in our storage space,
   can we a create structure of 4 pebbles
   similar to [249 253 255 256], but ending with 248 on the top of the stack?
   yes! consider   : [1 129 193 225 241 245 246 247 248
   (it is like fitting the structure so far popped into the space just below)

 SAVE AND LOAD:
   As the state we were keeping wasn't really something very complex,
   we just decided to store the JSON representation of the state as such.

 SPACE:
   As we saw in the description of the algorithm, the log(n) bound on space
   is obvious.

 TIME:
   Experimental verification:
      We slightly modified the hash function so that
      we could keep track of how many times it was invoked.
      We modified the "Test the entire chain" part of the test to print
      the total hash count divided by number of iterations to get average
      number of hashes calculated per `advance` invocation.
      We verified that it grew linearly with N where num_iter = 2^N
   Proof outline:
      We observe that once we store a pebble in the storage, it's hash
      is never calculated again.
      Consider the hash chain numbered in a slightly different format...
      [256 128 64 32 16 8 4 2 1    ... (Initial pebble structure)
  --> How many times are hashes of the above calculated? Only once.
      How about 17, 19?
      Once for calculating initial pebble structure.
      Not calculated until 16 was popped.
      After 16 was popped, hashes from 31 to 17 will be recalculated.
      [256 128 64 32 24 20 18 17
  --> Thus 17 was calculated twice.
      See that 19 isn't still there in the storage. It will be calculated
      after 17 and 18 are popped. At that time, it will be stored.
  --> Thus 19 was calculated thrice.
      We observe that the hash at N will be calculated exactly M times
      where M is the number of 1s in its binary representation.
      We know M is bounded above by ceil (log (N))

      
2. If you were designing an authentication mechanism for
   a hot new startup that wants to protect its users,
   how would you decide whether/where to use S/KEY?
-->


3. How long did you spend on this project?
--> Less than 2 hours for actual coding.
   Way more time agonizing over "Why am I not able to think of any amortized
   constant time implementation"
*/


/********* External Imports and Convenience Functions ********/


"use strict"; // Makes it easier to catch errors.

var sjcl = require("./lib/sjcl");

// Hashes a string or bitArray to a bitArray.
var hash = sjcl.hash.sha256.hash;

var is_equal = sjcl.bitArray.equal; // Compares two bitArrays.
var hex = sjcl.codec.hex.fromBits; // Converts a bitArray to a hex string.

var pow2 = Math.pow.bind(this, 2); // Calculates 2 to a given power.
var log2 = function(x) {return Math.log(x) / Math.log(2);};

var Stack = Array;
Stack.prototype.top = function () {
    return this [this.length - 1];
};

/******** Naive Hash Chain Implementation ********/


function naive_chain() {

    var chain = {
        state: null
    };

    chain.initialize = function(num_iterations, seed) {
        chain.state = {
            position: 0,
            num_iterations: num_iterations,
            start: hash(seed)
        };

        var initial = chain.state.start;
        for (var i = 0; i < chain.state.num_iterations; i++) {
            initial = hash(initial);
        }

        return initial;
    };

    chain.advance = function() {
        if (chain.state.position + 1 > chain.state.num_iterations) {
            return null;
        }

        var value = chain.state.start;
        for (var i = 1;
             i < chain.state.num_iterations - chain.state.position;
             i++)
        {
            value = hash(value);
        }
        chain.state.position += 1;
        return value;
    };

    // Returns a string.
    chain.save = function() {
        return JSON.stringify(chain.state);
    };

    // Loads a string.
    chain.load = function(str_data) {
        chain.state = JSON.parse(str_data);
    };

    return chain;
}


/* Pebble-Based Hash Chain Implementation(Jakobsson's algorithm) */

// We start indexing the chain from 1.
// Chain [1] is hash (seed)
// Chain [2] is hash (hash (seed)) and so on...
function PebbleChain () {}

PebbleChain.prototype.hash = function (obj) {
    // For testing and emperical verification purposes.
    // Uncomment the following line

    // this.hash_count += 1;
    return hash (obj);
};

PebbleChain.prototype.make_log_pebbles = function (top_pebble_index) {
    // When the stack is like :
    // [1 9 13
    // and, say, top_pebble is 16
    // then resultant stack would be
    // [1 9 13 15 16
    var num_hashes = top_pebble_index - this.stack.top().index;
    var num_pebbles = Math.floor (log2 (num_hashes));
    var hash_value = this.hash (this.stack.top().hash);

    for (var i = this.stack.top().index + 1;
         i <= top_pebble_index;
         i++)
    {
        if (i == top_pebble_index - pow2 (num_pebbles) + 1) {
            this.stack.push ({index : i, hash : hash_value});
            num_pebbles -= 1;
        }
        hash_value = this.hash (hash_value);
    }
};

PebbleChain.prototype.initialize = function (num_iterations, seed) {
    var num_pebbles = Math.floor (log2 (num_iterations));
    this.index = num_iterations;
    this.stack = new Stack ();
    this.hash_count = 0;

    this.stack.push ({index : 1, hash : this.hash (seed)});

    this.make_log_pebbles (num_iterations);
    return this.hash (this.stack.top().hash);
};

PebbleChain.prototype.advance = function () {
    // Advance returns Chain [index]
    // and then decreases index.
    if (this.index == 0) return null;
    if (this.stack.top().index != this.index) {
        this.make_log_pebbles (this.index);
    }
    this.index -= 1;
    return this.stack.pop().hash;
};

// Returns a string.
PebbleChain.prototype.save = function () {
    var state = {
        index      : this.index,
        stack      : this.stack,
        hash_count : this.hash_count
    };
    return JSON.stringify (state);
};

// Loads a string.
PebbleChain.prototype.load = function (str_data) {
    var state = JSON.parse (str_data);
    this.index = state.index;
    this.stack = state.stack;
    this.hash_count = state.hash_count;
};

function pebble_chain () {
    return new PebbleChain ();
}

/********* Export functions for testing. ********/


module.exports.naive_chain = naive_chain;
module.exports.pebble_chain = pebble_chain;


/********* End of Original File ********/
