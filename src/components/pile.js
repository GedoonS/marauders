import { Card } from './card.js';

/**
 * Represents a collection of Card objects (deck, hand, discard, etc.)
 */
class Pile {
  /**
   * @param {Object} params
   * @param {string} params.id - Identifier for the pile (e.g. PLAYER_FATE)
   * @param {string|null} [params.owner=null] - Owner of the pile (player, house, etc.)
   * @param {Card[]} [params.cards=[]] - Initial cards in the pile
   */
  constructor({ id, owner = null, cards = [] } = {}) {
    this.id = id;
    this.owner = owner;
    this.cards = cards;
  }

  /**
   * Randomizes the order of cards in the pile
   */
  shuffle(times = 1) {
    for (let i = times; i > 0; i--) {
      this.cards.sort(() => Math.random() - 0.5);
    }
  }

  /**
   * Draws the top card from the pile
   * @returns {Card|null} The drawn card or null if empty
   */
  draw() {
    return this.cards.pop() || null;
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
}

export { Pile };
