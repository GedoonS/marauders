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
   * Draws a card from the pile
   * @param {number|false} index - optional index, defaults to top card
   * @returns {Card|null}
   */
  draw(index = false) {
    let card = null;
    if (typeof index === 'number') {
      if (index < 0 || index >= this.cards.length) return null;
      [card] = this.cards.splice(index, 1);

      console.log('drawing', index, card);
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
