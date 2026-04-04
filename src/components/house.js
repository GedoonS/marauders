import { Card } from './card';
import { PLAYER_PILES } from './config';
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
  DROP_LOOT: { action: 'drop_loot', label: 'Drop Loot' },
};

const STATE_ACTIONS = {
  idle: [ACTIONS.DRAW_FATE],
  enemy_visible: [ACTIONS.COMBAT, ACTIONS.RUN],
  combat: [ACTIONS.DRAW_STAMINA, ACTIONS.RUN],
  loot_visible: [ACTIONS.STASH_LOOT],
  enemy_defeated: [ACTIONS.CONTINUE],
  loot_selection: [ACTIONS.LOOT_SELECTION, ACTIONS.DROP_LOOT],
};

/**
 * Controls game logic, piles, and flow
 */
class House {
  constructor() {
    this.piles = {}; // { id: Pile }
    this.state = 'idle'; // 'idle' | 'combat' | 'loot' | etc.
    this.applyDefenceModifier = this.applyDefenceModifier.bind(this);
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

      this.piles[deckName].shuffle();
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
        this.handleRun();
        break;

      case ACTIONS.DRAW_FATE.action:
        this.handleDrawFate();
        break;

      case ACTIONS.STASH_LOOT.action:
        this.handleStashLoot();
        break;

      case ACTIONS.LOOT_SELECTION.action:
        this.handleLootSelection();
        break;

      case ACTIONS.DROP_LOOT.action:
        this.handleLootDrop();
        break;

      case ACTIONS.COMBAT.action:
        this.handleCombat();

      case ACTIONS.DRAW_STAMINA.action:
        this.handleDrawStamina();
        break;
    }
    this.calculateCombatModifiers();
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
      this.applyDefenceModifier();
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

  handleLootDrop() {
    this.deal({
      fromId: 'combat',
      toId: 'discardStamina',
      count: this.getPile('combat').cards.length,
    });

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
    this.applyAttackModifiers();
    const combatPile = this.getPile('combat');

    if (this.isEnemyDefeated()) {
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

  combatModifiers = {
    defenceMult: 1,
    defenceAdd: 0,
    attack1: null,
    attack2: null,
  };

  /**
   * Calculate player combatModifiers gear/trinket cards that may have combat modifiers
   */
  calculateCombatModifiers() {
    const combats = [];

    for (const entry of PLAYER_PILES) {
      const pile = this.getPile(entry.pile);

      if (pile?.cards?.[0]?.combat) combats.push(pile.cards[0].combat);
    }

    const attacks = [];
    this.combatModifiers.defenceAdd = 0;
    this.combatModifiers.defenceMult = 1;

    for (const combat of combats) {
      if (combat.sub !== undefined) {
        this.combatModifiers.defenceAdd += combat.sub;
      } else if (combat.div !== undefined) {
        this.combatModifiers.defenceMult *= combat.div;
      } else if (combat.add !== undefined || combat.mult !== undefined) {
        attacks.push(combat);
      }
    }

    this.combatModifiers.attack1 = attacks[0] ?? null;
    this.combatModifiers.attack2 = attacks[1] ?? null;
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

  modifiers = {};

  /**
   * Applies defence modifier to the currently visible enemy
   */
  applyDefenceModifier() {
    const pile = this.getPile('wrath');
    if (!pile) return;

    const enemy = pile.cards.find((card) => card.liveEnemy);
    if (!enemy) return;

    const { defenceAdd, defenceMult } = this.combatModifiers;

    const amount = (defenceAdd || 1) * (defenceMult || 1);
    if (amount > 1) {
      const defenceModifier = {
        amount,
        card: enemy,
        labelPrefix: '-',
        method: 'add',
      };
      this.modifiers.defence = defenceModifier;
      enemy.modifier = this.modifiers.defence;

      // Show the label on the enemy card. This needs to be delayed to make sure the Card gets rendered and receives the modifierLabel before calling this
      setTimeout(() => {
        enemy.setModifierLabel({
          text: `def ${this.modifiers.defence.labelPrefix}${amount}`,
          bgColor: 0xff0000,
          show: amount > 1,
        });
      }, 100);
    }
  }

  /**
   * Applies attack modifiers to the first two cards in the combat pile
   */
  applyAttackModifiers() {
    const pile = this.getPile('combat');
    if (!pile || !pile.cards.length) return;

    const { attack1, attack2 } = this.combatModifiers;
    const attacks = [attack1, attack2];

    for (let i = 0; i < attacks.length; i++) {
      const card = pile.cards[i];
      const attack = attacks[i];
      if (!card || !attack) continue;

      const amount = attack.add ?? attack.mult ?? 0;
      if (amount > 1) {
        const attackModifier = {
          amount: amount,
          card,
          labelPrefix: attack.add !== undefined ? '+' : 'x',
          method: attack.add !== undefined ? 'add' : 'multiply',
        };

        this.modifiers[`attack${i + 1}`] = attackModifier;

        card.modifier = this.modifiers[`attack${i + 1}`];

        // Show the label after a short delay
        setTimeout(() => {
          card.setModifierLabel({
            text: `att ${attackModifier.labelPrefix}${attackModifier.amount}`,
            bgColor: 0x00ff00, // pick color
            show: amount > 1,
          });
        }, 100);
      }
    }
  }

  /**
   * Checks if player defeats the enemy with current combat pile
   * @returns {boolean} true if combatSum >= wrathSum
   */
  isEnemyDefeated() {
    const combatPile = this.getPile('combat');
    const combatSum = combatPile?.getSum() || 0;
    const wrathSum = this.getPile('wrath')?.getSum() || 0;

    return combatSum >= wrathSum;
  }
}

export { House };
