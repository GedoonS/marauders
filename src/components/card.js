/**
 * @typedef {Object} Combat
 * @property {'add'|'multiply'} type - Type of modifier
 * @property {number} value - Value of the modifier
 */

/**
 * Represents a single card instance in the game.
 */
class Card {
  isSelectedState = false;

  /**
   * @param {Object} params
   * @param {string} params.id - Logical identifier of the card (game identity, not unique instance id).
   * @param {'fate'|'stamina'} params.type - Deck/category the card belongs to.
   * @param {number} [params.spirit=0] - Base spirit value (typically used by player).
   * @param {number} [params.wrath=0] - Base wrath value (typically used by enemies).
   * @param {boolean} [params.faceUp=false] - Whether the card is currently revealed.
   * @param {boolean} [params.rotated=false] - Whether the card is rotated (used for state indication).
   * @param {string} [params.graphicId=''] - Visual identifier used by renderer.
   * @param {Combat|null} [params.combat=null] - Optional combat modifier applied when card participates in combat.
   * @param {string} [params.layout='none'] - Layout key used by renderer to position labels.
   * @param {boolean} [params.liveEnemy=false] - True if this card represents an active enemy.
   * @param {boolean} [params.isLoot=false] - True if this card represents loot.
   * @param {boolean} [params.isEnemy=false] - True if this card represents enemy.
   */
  constructor({
    id,
    type,
    spirit = 0,
    wrath = 0,
    faceUp = false,
    rotated = false,
    graphicId = '',
    combat = null,
    layout = 'none',
    lootValue = 0,
    liveEnemy = false,
    isLoot = false,
    isEnemy = false,
  }) {
    this.id = id;
    this.type = type;
    this.spirit = spirit;
    this.wrath = wrath;
    this.faceUp = faceUp;
    this.rotated = rotated;
    this.graphicId = graphicId;
    this.combat = combat;
    this.layout = layout;
    this.liveEnemy = liveEnemy;
    this.isLoot = isLoot;
    this.isEnemy = isEnemy;
    this.lootValue = lootValue;
  }

  /**
   * Turns the card face up or down.
   * @param {boolean} [faceUp]
   */
  turn(faceUp = undefined) {
    if (typeof faceUp === 'boolean') this.faceUp = faceUp;
    else this.faceUp = !this.faceUp;
  }

  /**
   * Rotates the card 180° (for wrath state etc).
   * @param {boolean} [rotated]
   */
  rotate(rotated = undefined) {
    if (typeof rotated === 'boolean') this.rotated = rotated;
    else this.rotated = !this.rotated;
  }
  /**
   * Returns the effective value of this card for comparisons.
   *
   * @returns {number}
   */
  getValue() {
    if (this.isEnemy) {
      return this.liveEnemy ? this.spirit : this.wrath;
    } else if (this.isLoot) {
      return this.spirit;
    } else {
      return this.spirit;
    }
  }

  defeated() {
    if (!this.isEnemy) return; // Only enemies can be defeated

    this.liveEnemy = false;
    this.rotated = true;

    // Flip the Pixi container if it exists
    if (this.container) {
      this.container.rotation = Math.PI;
    }

    // Optionally, you could update the card value logic automatically
    // but your getValue() already uses liveEnemy/spirit/wrath correctly
  }

  get isSelected() {
    return this.isSelectedState;
  }

  set isSelected(value) {
    this.isSelectedState = Boolean(value);

    if (this.container) {
      this.container.rotation = this.isSelectedState ? Math.PI / 2 : 0;
    }
  }
}

export { Card };
