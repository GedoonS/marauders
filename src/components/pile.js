import { Card } from './card.js';
import { shuffle } from './rng.js';
import { CARDWIDTH, WIDTH } from './config';

/**
 * Represents a collection of Card objects (deck, hand, discard, etc.)
 */
class Pile {
  /**
   * @param {Object} params
   * @param {string} params.id - Identifier for the pile (e.g. PLAYER_FATE)
   * @param {Card[]} [params.cards=[]] - Initial cards in the pile
   * @param {string|null} [params.subtypeAllowed=null] - Accepted subtypes for this pile (for example 'hand', 'helmet'
   */
  constructor({ id, owner = null, cards = [], subtypeAllowed = null } = {}) {
    this.id = id;
    this.owner = owner;
    this.cards = cards;
    this.subtypeAllowed = subtypeAllowed;
  }

  /**
   * @param {Slot[]} [slot] - Parent slot of the pile
   * */
  setParentSlot(slot) {
    this.slot = slot;
  }

  /**
   * @param {string} subtypeAllowed - Accepted subtypes for this pile (for example 'hand', 'helmet'
   */
  setSubtypeAllowed(subtypeAllowed) {
    this.subtypeAllowed = subtypeAllowed;
  }

  /**
   * @param {number} maxCards - Maximum number of cards the pile can hold
   */
  setMaxCards(maxCards) {
    this.maxCards = maxCards;
  }

  /**
   * Randomizes the order of cards in the pile
   */
  shuffle(times = 5) {
    shuffle(this.cards, times);
    // for (let i = times; i > 0; i--) {
    //   this.cards.sort(() => Math.random() - 0.5);
    // }
  }
  /**
   * Draws a card from the pile
   * @param {number|false} index - optional index, defaults to top card
   * @returns {Card|null}
   */
  draw(index = false, spawnCoords = null) {
    let card = null;
    if (typeof index === 'number') {
      if (index < 0 || index >= this.cards.length) return null;
      [card] = this.cards.splice(index, 1);
    } else {
      card = this.cards.pop() || null;
    }

    if (!card) return null;

    // --- Detach from Pixi if rendered ---
    if (card.container) {
      const memoryCoordinates = card.container.getGlobalPosition();
      card.oldX = memoryCoordinates.x;
      card.oldY = memoryCoordinates.y;
      card.oldRotate = card.rotation + card.container.parent.rotation;
      card.container?.parent.removeChild(card.container);
    } else if (card.backContainer) {
      const memoryCoordinates = card.backContainer.getGlobalPosition();
      card.oldX = memoryCoordinates.x;
      card.oldY = memoryCoordinates.y;
      card.oldRotate = card.backContainer.parent.rotation;
      card.backContainer?.parent.removeChild(card.backContainer);
    } else {
      card.oldX = spawnCoords?.x ?? (WIDTH - CARDWIDTH) / 2;
      card.oldY = spawnCoords?.y ?? 0;
      card.oldRotate = 0;
    }

    // Optional: reset so renderer knows it must re-render
    card.container = null;
    card.backContainer = null;

    return card;
  }

  /**
   * Adds one or more cards to the top of the pile
   * @param {...Card} cards - Cards to add
   */
  add(...cards) {
    this.cards.push(...cards);
  }

  /**
   * Adds one or more cards to the bottom of the pile
   * @param {...Card} cards - Cards to add
   */
  addToBottom(...cards) {
    this.cards.unshift(...cards);
  }

  /**
   * Initializes the pile with a new set of cards
   * @param {Card[]} cards - Cards to populate the pile with
   */
  init(cards = []) {
    this.cards = [...cards];
  }

  /**
   * Returns the sum of all card values in this pile
   * @returns {number}
   */
  getSum() {
    let sum = 0;
    this.cards.forEach((card) => {
      sum += card.getValue();
    });
    return sum;
  }
}

export { Pile };
