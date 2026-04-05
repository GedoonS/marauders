import { Card } from './card.js';
import { shuffle } from './rng.js';

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
  draw(index = false) {
    let card = null;
    if (typeof index === 'number') {
      if (index < 0 || index >= this.cards.length) return null;
      [card] = this.cards.splice(index, 1);
    } else {
      card = this.cards.pop() || null;
    }

    if (!card) return null;

    // --- Detach from Pixi if rendered ---
    card.container?.parent.removeChild(card.container);
    card.backContainer?.parent.removeChild(card.backContainer);

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
