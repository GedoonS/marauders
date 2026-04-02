import { Card } from './card';
import { Pile } from './pile';
import { Slot } from './slot';

const ACTIONS = {
  DRAW_FATE: { action: 'draw_fate', label: 'Draw Fate' },
  DRAW_STAMINA: { action: 'draw_stamina', label: 'Draw Stamina' },
  COMBAT: { action: 'combat', label: 'Combat' },
  RUN: { action: 'run', label: 'Run' },
  STASH_LOOT: { action: 'stash_loot', label: 'Stash Loot' },
  CONTINUE: { action: 'continue', label: 'Continue' },
  LOOT_SELECTION: { action: 'loot_selection', label: 'Select Loot', message: true },
};

const STATE_ACTIONS = {
  idle: [ACTIONS.DRAW_FATE],
  enemy_visible: [ACTIONS.COMBAT, ACTIONS.RUN],
  combat: [ACTIONS.DRAW_STAMINA, ACTIONS.RUN],
  loot_visible: [ACTIONS.STASH_LOOT],
  enemy_defeated: [ACTIONS.CONTINUE],
  loot_selection: [ACTIONS.LOOT_SELECTION],
};

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

  /**
   * Builds all decks and performs initial dealing based on configuration
   * @param {Object} config
   */
  buildDecks(config) {
    for (const [deckName, cardEntries] of Object.entries(config.decks)) {
      if (!this.piles[deckName]) {
        this.piles[deckName] = new Pile({ id: deckName });
      }
      cardEntries.forEach(({ cardType, count, type, faceUp }) => {
        const factory = new cardType();
        this.piles[deckName].add(...factory.createMany({ count, type, faceUp }));
      });

      this.piles[deckName].shuffle(20);
    }

    for (const { from, to, count } of config.deal) {
      this.deal(from, to, count);
    }
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

      if (card) {
        if (typeof faceUp === 'boolean') card.turn(faceUp);
        to.add(card);
      }
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

  /**
   * Handles card click interactions based on current game state
   * @param {{card: Card, pile: Pile, slot: Slot}} context
   */
  handleCardClick(context) {
    if ([ACTIONS.LOOT_SELECTION.action].includes(this.state)) {
      const { card, pile } = context;
      for (const pilecard of pile.cards) if (pilecard !== card) pilecard.isSelected = false;
      if (card) card.isSelected = !card.isSelected;
    }
  }

  /**
   * Returns available actions based on state
   */
  getActions() {
    return STATE_ACTIONS[this.state] || [];
  }

  /**
   * Starts an action and updates game state accordingly
   * @param {string} action
   * @returns {Promise<boolean>}
   */
  async startAction(action) {
    switch (action) {
      case ACTIONS.DRAW_FATE.action: {
        this.deal('playerFate', 'wrath', 1, true);

        if (this.hasLoot('wrath')) {
          this.state = 'loot_visible';
          return true;
        }
        if (this.hasLiveEnemy('wrath')) {
          this.state = 'enemy_visible';
        }
        return true;
      }

      case ACTIONS.STASH_LOOT.action: {
        const wrath = this.getPile('wrath');
        const lootPile = this.getPile('loot');
        for (let i = wrath.cards.length - 1; i >= 0; i--) {
          const card = wrath.cards[i];
          if (card.isLoot) {
            const drawn = wrath.draw(i);
            if (drawn) lootPile.add(drawn);
          }
        }

        this.state = 'idle';
        return true;
      }

      case ACTIONS.LOOT_SELECTION.action: {
        const combatPile = this.getPile('combat');
        const lootPile = this.getPile('loot');
        for (let i in combatPile.cards) {
          const combatCard = combatPile.cards[i];
          if (combatCard.isLoot && combatCard.isSelected) {
            const drawn = combatPile.draw(i);
            if (drawn) lootPile.add(drawn);
          }
        }

        this.deal('combat', 'discardStamina', combatPile.cards.length);

        this.state = 'idle';
        return true;
      }

      case ACTIONS.COMBAT.action: {
        this.state = ACTIONS.COMBAT.action;
        return true;
      }

      case ACTIONS.DRAW_STAMINA.action: {
        // Move a card from playerStamina to combat
        this.deal('playerStamina', 'combat', 1, true);

        // Get sums
        const combatSum = this.getPile('combat')?.getSum() || 0;
        const wrathSum = this.getPile('wrath')?.getSum() || 0;

        if (combatSum >= wrathSum) {
          // Find the live enemy in wrath pile (assuming only one)
          this.getPile('wrath').cards.forEach((card) => {
            if (card.isEnemy && card.liveEnemy) {
              card.defeated();
            }
          });
          this.state = ACTIONS.LOOT_SELECTION.action;
        }

        return true;
      }
    }
  }

  /**
   * Returns true if pile contains any live enemy
   * @param {string} pileId
   */
  hasLiveEnemy(pileId) {
    const pile = this.getPile(pileId);
    if (!pile) return false;

    return pile.cards.some((card) => card.liveEnemy);
  }

  /**
   * Returns true if pile contains any loot
   * @param {string} pileId
   */
  hasLoot(pileId) {
    const pile = this.getPile(pileId);
    if (!pile) return false;

    return pile.cards.some((card) => card.isLoot);
  }
}

export { House };
