/**
 * Feistel hashes a given number.
 * @param {number} x - input of the feistel function
 * @param {number} bits - Number of bits in the input/output
 * @returns {number} Output of the feistel function
 */
function feistel(x, bits = 8) {
  const half = bits / 2;
  const mask = (1 << half) - 1;

  let left = x >> half;
  let right = x & mask;

  const newLeft = right;
  const newRight = left ^ ((right * 13 + 7) & mask);

  return (newLeft << half) | newRight;
}

/**
 * Reverses a single-round Feistel function.
 * @param {number} y - Output of the feistel function
 * @param {number} bits - Number of bits in the input/output
 * @returns {number} Original input x
 */
function unfeistel(y, bits = 8) {
  const half = bits / 2;
  const mask = (1 << half) - 1;

  const newLeft = y >> half;
  const newRight = y & mask;

  const right = newLeft;
  const left = newRight ^ ((right * 13 + 7) & mask);

  return (left << half) | right;
}

/**
 * Computes the next index in a cyclic permutation of [0, length-1]
 * using the mangle function. Guaranteed to visit each index once.
 *
 * @param {number} currentValue - Current value in the sequence.
 * @param {number} [length=10] - Length of the array or domain.
 * @returns {number} Next value in the sequence.
 */
function next(currentValue, length = 10) {
  const nextCandidate = mangle(currentValue) + 1;
  const nextMangled = mangle(nextCandidate);
  if (nextMangled >= length) return next(nextMangled, length);
  return nextMangled;
}

/**
 * Bit-manipulation function that scrambles an integer.
 * Used to generate a reproducible permutation.
 *
 * @param {number} x - Integer to mangle.
 * @returns {number} Mangled integer.
 */
function mangle(x) {
  const xorSeed = 22;
  const xorMask = (xorSeed << 6) | (xorSeed & 0b111111);

  const mask = 0b111111;
  const left = (x >> 6) & mask;
  const right = (x & mask) << 6;

  return (right | left) ^ xorMask;
}

/**
 * Shuffles an array in place using the "hop & swap" method
 * based on the next/mangle functions. Can perform multiple iterations.
 *
 * @param {Array} arr - Array to shuffle.
 * @param {number} [iterate=7] - How many times to repeat the shuffle.
 */
function shuffle(arr, iterate = 7) {
  const length = arr.length;
  if (length <= 1) return;

  let start = 0;
  let current = start;
  let prevValue = arr[current];

  do {
    const nextIndex = next(current, length);

    const temp = arr[nextIndex];
    arr[nextIndex] = prevValue;
    prevValue = temp;

    current = nextIndex;
  } while (current !== start);

  iterate--;
  if (iterate > 0) shuffle(arr, iterate);
}

export { feistel, unfeistel, shuffle };
