/**
 * Represents a single card instance in the game.
 *
 * A card consists of:
 * - type: logical identity or archetype of the card
 * - deck: determines deck type which affects for example card back type.
 * - tags: flexible classification labels
 * - data: extensible payload for card-specific properties
 * - state: numeric state index (e.g. 0 = primary, 1 = secondary)
 * - faceUp: whether the card is revealed
 */
class NeoCard {
  /** @type {Object|null} */
  #modifier = null;

  /** @type {string[]} */
  #tags = [];

  /** @type {Object} */
  #data = {};

  /** @type {number} */
  #state = 0;

  /** @type {boolean} */
  #faceUp = false;

  /** @type {number} */
  #tilt = 0;

  /** @type {boolean} */
  #active = false;

  /** @type {number} */
  #rotation = 0;

  /**
   * @param {Object} params
   * @param {string} params.type - Logical identifier or archetype of the card (stored as a tag)
   * @param {string} params.deck - Deck identifier (stored as a tag, used for visuals)
   * @param {string[]} [params.tags=[]] - Additional classification tags (e.g. 'enemy', 'weapon')
   * @param {Object} [params.data={}] - Extensible data specific to this card
   * @param {number} [params.state=0] - Initial state index
   * @param {boolean} [params.faceUp=false] - Initial face state
   * @param {number} [params.tilt=0] - Initial tilt in radians
   */
  constructor({ type, deck, tags = [], data = {}, state = 0, faceUp = false, tilt = 0 }) {
    this.#tags = [type, deck, ...tags];
    this.#data = data;
    this.#state = state;
    this.#faceUp = faceUp;
    this.#tilt = tilt;
  }

  /**
   * Checks if the card has a given tag.
   * @param {string} tag
   * @returns {boolean}
   */
  is(tag) {
    return this.#tags.includes(tag);
  }

  /**
   * Sets the card state index.
   * @param {number} index
   */
  set state(index) {
    this.#state = index;
  }

  /**
   * Gets the card state index.
   * @return {number} index
   */
  get state() {
    return this.#state;
  }

  /**
   * Turns the card face up or down.
   * @param {boolean} state - sets face state
   */
  set faceUp(state) {
    this.#faceUp = Boolean(state);
  }

  /**
   * Is the card face up or down?
   * @returns {boolean} state - true for up
   */
  get faceUp() {
    return this.#faceUp;
  }

  /**
   * Sets whether the card is active/selected.
   * @param {boolean} value
   */
  set active(value) {
    this.#active = Boolean(value);
  }

  /**
   * Sets the tilt (visual rotation offset).
   * @param {number} radians
   */
  set tilt(radians) {
    this.#tilt = radians;
  }

  /**
   * Gets the tilt value.
   * @returns {number}
   */
  get tilt() {
    return this.#tilt;
  }

  /**
   * Gets whether the card is active/selected.
   *
   * @returns {boolean}
   */
  get active() {
    return this.#active;
  }

  /**
   * Assigns a modifier to this card.
   *
   * @param {Object|null} mod - Modifier object (structure defined elsewhere)
   */
  addModifier(mod) {
    if (typeof mod === 'object') this.#modifier = mod;
  }

  /**
   * Computes the effective value of the card.
   * Intended to be overridden by subclasses or external systems.
   *
   * @returns {number}
   */
  getValue() {
    return 0;
  }

  /**
   * Computes the final target rotation of the card in radians.
   * Combines state-based rotation, tilt, and active offset.
   *
   * @returns {number}
   */
  getTargetRotation() {
    // The card status defines how the card is oriented.
    const stateRotationMap = [0, -Math.PI / 2, Math.PI];
    const stateRotation = stateRotationMap[this.#state] ?? 0;

    // An active (ie. highlighted, selected) card is rotated.
    const activeOffset = this.#active ? Math.PI / 2 : 0;

    // Final rotation is the sum of status and active states plus visual tilt
    return stateRotation + activeOffset + this.#tilt;
  }

  /**
   * Sets the card rotation.
   * @param {number} angle
   */
  set rotation(angle) {
    if (typeof angle === 'number') this.#rotation = angle;
  }

  /**
   * Gets the card rotation.
   * @returns {number}
   */
  get rotation() {
    return this.#rotation;
  }
}

export { NeoCard };
