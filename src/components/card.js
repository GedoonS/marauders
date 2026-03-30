/**
 * Represents a single card instance in the game.
 */
class Card {
  /**
   * @param {Object} params
   * @param {string} params.id - Logical identifier of the card (game identity).
   * @param {'fate'|'stamina'} params.type - Category of the card.
   * @param {number} [params.spirit=0] - Spirit value of the card.
   * @param {number} [params.wrath=0] - Wrath value of the card.
   * @param {boolean} [params.faceUp=false] - Whether the card is currently face up.
   * @param {string} [params.graphicId=''] - Visual identifier used for rendering (can differ from `id`).
   */
  constructor({
    id,
    type,
    spirit = 0,
    wrath = 0,
    faceUp = false,
    graphicId = '',
  }) {
    this.id = id;
    this.type = type;
    this.spirit = spirit;
    this.wrath = wrath;
    this.faceUp = faceUp;
    this.graphicId = graphicId;
  }

  /**
   * Turns the card face up or down.
   *
   * - If `faceUp` is provided, sets the state explicitly.
   * - If omitted, toggles the current state.
   *
   * @param {boolean} [faceUp]
   */
  turn(faceUp = undefined) {
    if (typeof faceUp === 'boolean') this.faceUp = faceUp;
    else this.faceUp = !this.faceUp;
  }
}

export { Card };
