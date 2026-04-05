import * as PIXI from 'pixi.js';
import { feistel, mangle } from '~/src/components/rng';

let rngTracking = 127;
let drift = 127;

function rollRng() {
  rngTracking = mangle(mangle(rngTracking) + rngTracking + drift++);
  return rngTracking;
}

/**
 * @typedef {Object} Combat
 * @property {'add'|'mult'|'sub'|'div'} type - Type of modifier
 * @property {number} value - Value of the modifier
 */

/**
 * @typedef {Object} Replenish
 * @property {'fate'|'stamina'} type - Type of modifier
 * @property {number} value - Value of the modifier
 */

/**
 * Represents a single card instance in the game.
 */
class Card {
  isSelectedState = false;
  ticker = PIXI.Ticker.shared;

  x = 0;
  y = 0;
  targetX = 0;
  targetY = 0;
  rotation = 0;
  targetRotation = 0;
  isMoving = false;
  isRotating = false;

  container = null;
  backContainer = null;

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
   * @param {Replenish|null} [params.replenish=null] - Optional replenish modifier applied when card replenishes player.
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
    replenish = null,
    layout = 'none',
    lootValue = 0,
    liveEnemy = false,
    isLoot = false,
    isEnemy = false,
    isWeapon = false,
    isReplenish = false,
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
    this.isWeapon = isWeapon;
    this.isReplenish = isReplenish;
    this.replenish = replenish;
    this.pseudex = rollRng();
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
      let modifier = 0;
      if (this.modifier?.card === this) {
        modifier = this.modifier.amount;
      }
      return this.liveEnemy ? this.spirit - modifier : this.wrath;
    } else if (this.isLoot && this.isLooted) {
      return this.lootValue;
    } else {
      let value = this.spirit;
      if (this.modifier?.card === this) {
        if (this.modifier.method === 'add') {
          value += this.modifier.amount;
        } else if (this.modifier.method === 'multiply') {
          value *= this.modifier.amount;
        }
      }
      return value;
    }
  }

  looted() {
    if (!this.isLoot) return; // Only loot can be looted
    this.isLooted = true;
  }

  defeated() {
    if (!this.isEnemy) return; // Only enemies can be defeated

    this.liveEnemy = false;
    this.rotated = true;

    // Flip the Pixi container if it exists
    if (this.container) {
      //this.container.rotation = Math.PI;
      this.targetRotation = Math.PI;
      this.animateRotation();
      this.setModifierLabel({ show: false });
    }

    // Optionally, you could update the card value logic automatically
    // but your getValue() already uses liveEnemy/spirit/wrath correctly
  }

  getSubtype() {
    return this.combat?.subtype ?? 'generic';
  }

  get isSelected() {
    return this.isSelectedState;
  }

  set isSelected(value) {
    this.isSelectedState = Boolean(value);
    if (this.container) {
      //this.container.rotation = this.isSelectedState ? Math.PI / 2 : 0;
      this.targetRotation = this.isSelectedState ? Math.PI / 2 : 0;
      this.animateRotation();
    }
  }

  /**
   * Animate movement of the card towards targetX / targetY
   */
  animateMovement() {
    if (this.isMoving) return;

    this.isMoving = true;
    const speed = 0.15;

    const step = () => {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        this.x = this.targetX;
        this.y = this.targetY;

        this.ticker.remove(step);
        this.isMoving = false;
      } else {
        this.x += dx * speed;
        this.y += dy * speed;
      }

      if (this.container) {
        this.container.x = this.x;
        this.container.y = this.y;
      } else if (this.backContainer) {
        this.backContainer.x = this.x;
        this.backContainer.y = this.y;
      }
      return;
    };

    this.ticker.add(step);
  }

  animateRotation() {
    if (this.isRotating) return;

    this.isRotating = true;

    const speed = 0.05; // tweak this

    const step = () => {
      const diff = this.targetRotation - this.rotation;

      // close enough → snap and stop
      if (Math.abs(diff) < 0.01) {
        this.rotation = this.targetRotation;
        if (this.container) {
          this.container.rotation = this.rotation;
        }

        this.ticker.remove(step);
        this.isRotating = false;
        return;
      }

      // move toward target
      this.rotation += diff * speed;

      if (this.container) {
        this.container.rotation = this.rotation;
      }
    };

    this.ticker.add(step);
  }

  /**
   * Configure and show/hide the modifier label for a card
   * @param {Object} params
   * @param {Card} params.card - Target card
   * @param {string} [params.text] - Text to display in the label
   * @param {number} [params.bgColor] - Background tint color
   * @param {boolean} [params.show] - Whether the label should be visible
   */
  setModifierLabel({ text, bgColor, show }) {
    //if (!this.modifierLabel) return;
    const label = this.modifierLabel;
    if (typeof text === 'string') label.textObj.text = text;
    if (typeof bgColor === 'number') label.bg.tint = bgColor;
    if (typeof show === 'boolean') label.container.visible = show;
  }
}

export { Card };
