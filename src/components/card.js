import * as PIXI from 'pixi.js';
import { feistel, mangle } from '~/src/components/rng';

let rngTracking = 127;
let drift = 127 + (Date.now() % 100);

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
    this.spirit = Math.ceil(spirit / 5) * 5;
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
    if (!this.isLoot) return;
    this.isLooted = true;
  }

  defeated() {
    if (!this.isEnemy) return;

    this.liveEnemy = false;
    this.rotated = true;

    // Flip the Pixi container if it exists
    if (this.container) {
      this.targetRotation = Math.PI;
      this.animateRotation();
      this.setModifierLabel({ show: false });
    }
  }

  getSubtype() {
    return this.combat?.subtype ?? 'generic';
  }

  get isSelected() {
    return this.isSelectedState;
  }

  set isSelected(value) {
    this.isSelectedState = Boolean(value);

    this.targetRotation = this.isSelectedState ? Math.PI / 2 : 0;
    this.animateRotation();
  }

  get isTilted() {
    return this.isTiltedState;
  }

  set isTilted(value) {
    this.isTiltedState = Boolean(value);
    this.targetRotation = this.isTiltedState ? Math.PI / 9 : 0;

    this.animateRotation();
  }

  resetTilt() {
    this.rotation = 0;
  }

  /**
   * Animate movement of the card towards targetX / targetY
   */
  animateMovement() {
    this.animationSpeed = 0.02;
    if (this.isMoving) return;

    this.isMoving = true;

    const step = ({ deltaTime }) => {
      this.animationSpeed *= 1 + deltaTime / 10;
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        this.x = this.targetX;
        this.y = this.targetY;

        this.ticker.remove(step);
        this.isMoving = false;
      } else {
        this.x += dx * this.animationSpeed;
        this.y += dy * this.animationSpeed;
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
      const diff = (this.targetRotation - this.rotation) % Math.PI;

      if (Math.abs(diff) < 0.01) {
        this.rotation = this.targetRotation;
        if (this.container) {
          this.container.rotation = this.rotation;
        } else if (this.backContainer) {
          this.backContainer.rotation = this.rotation;
        }

        this.ticker.remove(step);
        this.isRotating = false;
        return;
      }

      if (this.container) {
        // move toward target
        this.rotation += diff * speed;
        this.container.rotation = this.rotation;
      } else if (this.backContainer) {
        // move toward target
        this.rotation += diff * speed;
        this.backContainer.rotation = this.rotation;
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
    const timeout = Date.now() + 2000;
    while (!this.modifierLabel && Date.now() < timeout); // Wait till the modifierLabel is present or timeout
    const label = this.modifierLabel;
    if (typeof text === 'string') label.textObj.text = text;
    if (typeof bgColor === 'number') label.bg.tint = bgColor;
    if (typeof show === 'boolean') label.container.visible = show;
  }

  animateAlpha() {
    if (this.isFading) return;

    const speed = 0.05;
    const target = 1;

    const container = this.container ?? this.backContainer;
    container.alpha = 0;

    const step = () => {
      const diff = target - container.alpha;
      container.alpha += diff * speed;

      if (Math.abs(diff) < 0.01) {
        container.alpha = target;

        if (target === 0) {
          container.visible = false;
        }

        this.ticker.remove(step);
        this.isFading = false;
        return;
      }
    };

    this.isFading = true;
    this.ticker.add(step);
  }
}

export { Card };
