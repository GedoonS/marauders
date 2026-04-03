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
      this.deal({
        fromId: from,
        toId: to,
        count: count,
      });
    }
  }

  /**
   * Deals cards from one pile to another using an options object
   * @param {Object} params
   * @param {string} params.fromId
   * @param {string} params.toId
   * @param {Pile} params.fromPile
   * @param {Pile} params.toPile
   * @param {number} [params.count=1] - number of cards to draw
   * @param {number} [params.index] - specific index to draw from
   * @param {boolean} [params.faceUp]
   */
  deal({ fromId, fromPile, toPile, toId, count = 1, index, faceUp }) {
    const from = fromPile ?? this.getPile(fromId);
    const to = toPile ?? this.getPile(toId);
    if (!from || !to) return;

    if (typeof index === 'number') {
      const card = from.draw(index);

      if (card) {
        if (typeof faceUp === 'boolean') card.turn(faceUp);
        if (to.maxCards === to.cards.length) to.draw(0);

        to.add(card);
      }

      return;
    }

    for (let i = 0; i < count; i++) {
      const card = from.draw();

      if (card) {
        if (to.maxCards === to.cards.length) to.draw(0);
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
      const { card, pile, slot } = context;

      if (slot?.expectsSelection) {
        slot.toggleSelected();
      } else if (card) {
        for (const pilecard of pile.cards) if (pilecard !== card) pilecard.isSelected = false;
        card.isSelected = !card.isSelected;
        const subtype = card.getSubtype();
        if (card.isSelected && subtype) {
          Object.values(this.piles).forEach((pile) => {
            if (pile.slot?.expectsSelection) pile.slot.toggleExpectsSelection(false);
          });

          Object.values(this.piles).forEach((pile) => {
            if (pile.subtypeAllowed === subtype) {
              pile.slot.toggleExpectsSelection(true);
            }
          });
        }
      }
    }
  }

  /**
   * Returns available actions based on state
   */
  getActions() {
    return STATE_ACTIONS[this.state] || [];
  }

  /**
   * Routes and executes a game action based on the provided action key
   * @param {string} action
   * @returns {boolean}
   */
  startAction(action) {
    switch (action) {
      case ACTIONS.RUN.action:
        return this.handleRun();

      case ACTIONS.DRAW_FATE.action:
        return this.handleDrawFate();

      case ACTIONS.STASH_LOOT.action:
        return this.handleStashLoot();

      case ACTIONS.LOOT_SELECTION.action:
        return this.handleLootSelection();

      case ACTIONS.COMBAT.action:
        this.handleCombat();

      case ACTIONS.DRAW_STAMINA.action:
        return this.handleDrawStamina();
    }
  }

  /**
   * Handles player running away from combat:
   * removes live enemies from wrath and discards combat cards
   * @returns {boolean}
   */
  handleRun() {
    const wrath = this.getPile('wrath');
    const discardFate = this.getPile('discardFate');

    for (let i = wrath.cards.length - 1; i >= 0; i--) {
      const card = wrath.cards[i];
      if (card.liveEnemy) {
        this.deal({ fromId: 'wrath', toId: 'discardFate', index: i });
      }
    }

    const combatPile = this.getPile('combat');

    this.deal({
      fromId: 'combat',
      toId: 'discardStamina',
      count: combatPile.cards.length,
    });

    this.state = 'idle';
    return true;
  }

  /**
   * Draws a fate card into wrath and updates state based on result
   * @returns {boolean}
   */
  handleDrawFate() {
    this.deal({
      fromId: 'playerFate',
      toId: 'wrath',
      count: 1,
      faceUp: true,
    });

    if (this.hasLoot('wrath')) {
      this.state = 'loot_visible';
      return true;
    }

    if (this.hasLiveEnemy('wrath')) {
      this.state = 'enemy_visible';
    }

    return true;
  }

  /**
   * Moves all loot from wrath into loot pile and marks them as looted
   * @returns {boolean}
   */
  handleStashLoot() {
    const wrath = this.getPile('wrath');
    const lootPile = this.getPile('loot');

    for (let i = wrath.cards.length - 1; i >= 0; i--) {
      const card = wrath.cards[i];
      if (card.isLoot) {
        card.looted();
        this.deal({ fromId: 'wrath', toId: 'loot', index: i });
      }
    }

    this.state = 'idle';
    return true;
  }

  /**
   * Handles loot selection from combat pile:
   * - loot cards go directly to loot pile
   * - weapons require a selected destination slot
   * @returns {boolean}
   */
  handleLootSelection() {
    const combatPile = this.getPile('combat');
    const lootPile = this.getPile('loot');

    if (!combatPile.cards.some((card) => card.isSelected)) return true;

    for (let i in combatPile.cards) {
      i = parseInt(i);
      const combatCard = combatPile.cards[i];

      if (!combatCard.isSelected) continue;

      // --- loot ---
      if (combatCard.isLoot) {
        combatCard.looted();
        this.deal({
          fromId: 'combat',
          toId: 'loot',
          index: i,
        });

        this.deal({
          fromId: 'combat',
          toId: 'discardStamina',
          count: combatPile.cards.length,
        });

        this.state = 'idle';
        return true;
      }

      // --- weapon ---
      if (combatCard.isWeapon) {
        const targetPile = Object.values(this.piles).find((pile) => pile.slot?.isSelected);

        if (!targetPile) return true;

        // const drawn = combatPile.draw(i);
        // if (drawn) targetPile.add(drawn);

        this.deal({
          fromId: 'combat',
          toPile: targetPile,
          index: i,
        });

        targetPile.slot.toggleSelected(false);
        Object.values(this.piles).forEach((pile) => {
          if (pile.slot?.expectsSelection) pile.slot.toggleExpectsSelection(false);
        });

        this.deal({
          fromId: 'combat',
          toId: 'discardStamina',
          count: combatPile.cards.length,
        });

        this.state = 'idle';
        return true;
      }
    }

    return true;
  }

  /**
   * Enters combat state
   * @returns {boolean}
   */
  handleCombat() {
    this.state = ACTIONS.COMBAT.action;
    return true;
  }

  /**
   * Draws stamina into combat and resolves combat outcome
   * @returns {boolean}
   */
  async handleDrawStamina() {
    this.deal({
      fromId: 'playerStamina',
      toId: 'combat',
      count: 1,
      faceUp: true,
    });

    const combatPile = this.getPile('combat');
    const combatSum = combatPile?.getSum() || 0;
    const wrathSum = this.getPile('wrath')?.getSum() || 0;

    if (combatSum >= wrathSum) {
      this.getPile('wrath').cards.forEach((card) => {
        if (card.isEnemy && card.liveEnemy) {
          card.defeated();
        }
      });

      setTimeout(() => {
        if (combatPile.cards.length === 1) {
          this.handleCardClick({ card: combatPile.cards[0], pile: combatPile, slot: combatPile.slot });
        }
      }, 100);

      this.state = ACTIONS.LOOT_SELECTION.action;
    }

    return true;
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
