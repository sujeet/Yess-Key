Yess-Key
========

 An efficient implementation of S/KEY authentication in JavaScript.

1. Briefly describe your implementation and its design choices.
   e.g. What algorithm did you use? How did you structure your code?
   Did you do something interesting in "save" and "load"?
   Justify the space/time used by your implementation.
-->
 NOTE:
   Our impletemnation works irrespective of whether the number of iterations
   is power of two or not.
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
   can we a create structure of less than 4 pebbles
   similar to [253 255 256], but ending with 248 on the top of the stack?
   yes! consider   : [1 129 193 225 241 245 247 248
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
--> For S/KEY, seed needs to be stored on the client which might turn out to
   be a hassle for web-based apps. On the other hand, it will be a good idea
   when the app is a native app (android/iOS/desktop).

   Another thing that might work against S/KEY is if we plan to support
   a large number of devices. (Each device would have its own chain).

   To sum it up, if the startup isn't a website, but more like a native app,
   we would go with S/KEY. If it is a website and we want our users to be
   able to use the site from any computer, S/KEY isn't the thing we would go
   ahead with.

   In the later case where we have a website, but main focus is native apps,
   we could provide all the non critical functions via website, but for
   crucial things like trasactions, account management and password change
   etc, we would require a dual-authentication, (which, would be on the native
   apps). This, to us, seems to be a reasonable middle ground.


3. How long did you spend on this project?
--> Less than 2 hours for actual coding.
   Way more time agonizing over "Why am I not able to think of any amortized
   constant time implementation"
