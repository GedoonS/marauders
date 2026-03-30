import { Pile } from './pile';

/**
 * Controls game logic, piles, and flow
 */
class House {
  constructor() {
    this.piles = {}; // { id: Pile }
    this.state = 'idle'; // 'idle' | 'combat' | 'loot' | etc.
  }

  /**
   * Adds a pile
   * @param {Pile} pile
   */
  addPile(pile) {
    this.piles[pile.id] = pile;
  }

  /**
   * Gets a pile by id
   * @param {string} id
   * @returns {Pile|null}
   */
  getPile(id) {
    return this.piles[id] || null;
  }

  /**
   * Draws from a pile
   * @param {string} pileId
   */
  draw(pileId) {
    const pile = this.getPile(pileId);
    if (!pile) return null;
    return pile.draw();
  }

  buildDecks(config) {
    for (const [deckName, cardEntries] of Object.entries(config.decks)) {
      if (!this.piles[deckName]) {
        this.piles[deckName] = new Pile({ id: deckName });
      }
      cardEntries.forEach(({ cardType, count }) => {
        const factory = new cardType();
        this.piles[deckName].add(...factory.createMany({ count }));
      });

      this.piles[deckName].shuffle(20);
    }
    console.log(Object.keys(this.piles));
  }

  /**
   * Deals N cards from one pile to another
   */
  deal(fromId, toId, count = 1, faceUp = undefined) {
    const from = this.getPile(fromId);
    const to = this.getPile(toId);
    if (!from || !to) return;

    for (let i = 0; i < count; i++) {
      const card = from.draw();
      if (typeof faceUp === 'boolean') card.turn(faceUp);
      if (card) to.add(card);
    }
  }

  /**
   * Starts combat phase
   */
  startCombat() {
    this.state = 'combat';
  }

  /**
   * Ends combat phase
   */
  endCombat() {
    this.state = 'idle';
  }

  /**
   * Checks loss condition
   */
  isBust() {
    const stamina = this.piles['PLAYER_STAMINA'];
    return stamina && !stamina.cards.length;
  }
}

export { House };
