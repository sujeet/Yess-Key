
/********* External Imports and Convenience Functions ********/


"use strict"; // Makes it easier to catch errors.

var sjcl     = require("./lib/sjcl");
var hash = sjcl.hash.sha256.hash; // Hashes a string or bitArray to a bitArray.
var is_equal = sjcl.bitArray.equal; // Compares two bitArrays.
var hex = sjcl.codec.hex.fromBits; // Converts a bitArray to a hex string.

var pow2 = Math.pow.bind(this, 2); // Calculates 2 to a given power.
var log2 = function(x) {return Math.log(x) / Math.log(2);} // Calculates log base 2.

var skey = require("./skey");


/******** Run the hash chain. ********/


function verifyBitArray(arr) {
  if (!(arr instanceof Array)) {
    console.trace("Expected a bitArray; got something else: " + arr);
    throw "Halting tests."
  }
}


function test_chain(constructor, seed, num_iterations) {
  var initial_ = seed;
  for (var i = 0; i < num_iterations + 1; i++) {
    initial_ = hash(initial_);
  }

  var chain = constructor();
  var initial = chain.initialize(num_iterations, seed);

  verifyBitArray(initial);
  if (initial instanceof Array) {
    console.log("[SUCCESS] Initialized successfully.");
  } else {
    console.log("[FAILED] Initial value should be a bitArray.");
  }

  // Test initial value;

  if (is_equal(initial, initial_)) {
    console.log("[SUCCESS] Initial value is correct.");
  } else {
    console.log("[FAILED] Initial should be " + hex(initial_) + ", but it is " + hex(initial) + ".");
  }

  // Test the entire chain.

  var vk = initial;
  for (var i = 0; i < num_iterations; i++) {
    var current = chain.advance();
    verifyBitArray(current);
    if (! is_equal(hash(current), vk)) {
      console.log("[FAILED] Value #" + i + " is incorrect. Halting tests.");
      return;
    }
    var vk = current;
  }
  console.log("[SUCCESS] All values in the chain were correct.")

  // Check that the chain ends.

  var after_last = chain.advance();
  if (after_last === null) {
    console.log("[SUCCESS] Chain ends correctly.");
  } else {
    console.log("[FAILED] After the hash chain ended, advance() did not output null.");
  }

  // Test saving.

  var chain = constructor();
  var initial = chain.initialize(num_iterations, seed);

  for (var i = 1; i < num_iterations/3; i++) {
    chain.advance();
  }
  var previous = chain.advance();
  var saved = chain.save();

  if (typeof saved == "string") {
    console.log("[SUCCESS] Saved successfully.");
  } else {
    console.log("[FAILED] Saving state did not produce a string.");
  }

  // Test loading.
  var new_chain = constructor();
  new_chain.load(saved);

  new_chain.advance();
  var next = new_chain.advance();

  verifyBitArray(next);
  if (is_equal(previous, hash(hash(next)))) {
    console.log("[SUCCESS] Loaded from saved state successfully.");
  } else {
    console.log("[FAILED] Loading from saved state failed.");
  }
}

var num_iterations = pow2(4);

console.log("-------- Testing Naive Algorithm --------");
test_chain(skey.naive_chain, "The rain in spain stays mainly in the plain.", num_iterations);
console.log("-------- Testing Pebble Algorithm --------");
test_chain(skey.pebble_chain, "The rain in spain stays mainly in the plain.", num_iterations);
