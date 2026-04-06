/**
 * CardAbacus
 *
 * Maintains a 3-digit (0–999) abacus-like state using card piles.
 * Each pile (I, X, C) represents a decimal digit:
 *
 * - I = ones
 * - X = tens
 * - C = hundreds
 *
 * Each digit is encoded as:
 * - V (0–1): sideways card representing 5
 * - I (0–4): upright cards representing 1s
 *
 * Example:
 *   7 → { V: 1, I: 2 }
 *   3 → { V: 0, I: 3 }
 *
 * The class tracks previous state and returns the minimal set of
 * operations needed to transition to a new number.
 */
/**
 * @typedef {'I' | 'X' | 'C'} AbacusPile
 */

/**
 * Represents one digit in a pile.
 * V = sideways (5), I = upright (1s)
 *
 * @typedef {Object} AbacusDigit
 * @property {0|1} V
 * @property {0|1|2|3|4} I
 */

/**
 * Full abacus state.
 *
 * @typedef {Object} AbacusState
 * @property {AbacusDigit} I
 * @property {AbacusDigit} X
 * @property {AbacusDigit} C
 */

/**
 * Operation needed to transition between states.
 *
 * @typedef {Object} AbacusOperation
 * @property {'add_V' | 'sub_V' | 'add_I' | 'sub_I'} type
 * @property {AbacusPile} pile
 * @property {number} count
 */

class CardAbacus {
  constructor() {
    this.state = this.#numberToState(0);
  }

  /**
   * Update the abacus to a new number.
   *
   * @param {number} number - Integer in range 0–999
   * @returns {AbacusOperation[]} List of operations to transition state
   */
  update(number) {
    const next = this.#numberToState(number);
    const ops = [];

    for (const pile of ['I', 'X', 'C']) {
      const prevDigit = this.state[pile];
      const nextDigit = next[pile];

      if (prevDigit.V !== nextDigit.V) {
        if (nextDigit.V === 1) {
          ops.push({ type: 'add_V', pile, count: 1 });
        } else {
          ops.push({ type: 'sub_V', pile, count: -1 });
        }
      }

      const diff = nextDigit.I - prevDigit.I;
      if (diff > 0) {
        ops.push({ type: 'add_I', pile, count: diff });
      } else if (diff < 0) {
        ops.push({ type: 'sub_I', pile, count: -diff });
      }
    }

    this.state = next;
    return ops;
  }

  /**
   * Convert a number into internal abacus state.
   *
   * @param {number} n - Integer in range 0–999
   * @returns {AbacusState}
   */
  #numberToState(n) {
    const digits = {
      I: n % 10,
      X: Math.floor(n / 10) % 10,
      C: Math.floor(n / 100) % 10,
    };

    const toPile = (d) => ({
      V: d >= 5 ? 1 : 0,
      I: d >= 5 ? d - 5 : d,
    });

    return {
      I: toPile(digits.I),
      X: toPile(digits.X),
      C: toPile(digits.C),
    };
  }
}

export { CardAbacus };
