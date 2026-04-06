import { Card } from './card';
import { CardAbacus } from './card-abacus';
import { PLAYER_PILES, VICTORY_GEMS } from './config';
import { Pile } from './pile';
import { shuffle } from './rng';
import { Slot } from './slot';

/**
 * Controls game logic, piles, and flow
 */
class House {
  constructor() {
    this.piles = {}; // { id: Pile }
    this.state = 'start';
    this.applyDefenceModifier = this.applyDefenceModifier.bind(this);
  }

  ACTIONS = {
    DRAW_FATE: { action: 'draw_fate', label: 'Draw Fate' },
    DRAW_STAMINA: { action: 'draw_stamina', label: 'Draw Stamina' },
    COMBAT: { action: 'combat', label: 'Combat' },
    RUN: { action: 'run', label: 'Run' },
    STASH_LOOT: { action: 'stash_loot', label: 'Stash Loot' },
    CONTINUE: { action: 'continue', label: 'Continue' },
    LOOT_SELECTION: { action: 'loot_selection', label: 'Select Loot', message: true },
    DROP_LOOT: { action: 'drop_loot', label: 'Drop Loot' },
    REPLENISH: { action: 'consume_replenish', label: 'Consume' },
    START: { action: 'start' },
    DEFEATED: { action: 'defeated' },
    EXHAUSTED: { action: 'exhausted' },
    VICTORY: { action: 'victory' },
  };

  STATE_ACTIONS = {
    start: [this.ACTIONS.START],
    victory: [this.ACTIONS.VICTORY],
    defeated: [this.ACTIONS.DEFEATED],
    exhausted: [this.ACTIONS.EXHAUSTED],
    idle: [this.ACTIONS.DRAW_FATE],
    enemy_visible: [this.ACTIONS.COMBAT, this.ACTIONS.RUN],
    combat: [this.ACTIONS.DRAW_STAMINA, this.ACTIONS.RUN],
    loot_visible: [this.ACTIONS.STASH_LOOT],
    replenish_visible: [this.ACTIONS.REPLENISH],
    enemy_defeated: [this.ACTIONS.CONTINUE],
    loot_selection: [this.ACTIONS.LOOT_SELECTION, this.ACTIONS.DROP_LOOT],
  };

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
      shuffle(cardEntries, 5);

      cardEntries.forEach(({ cardType, count, type, faceUp }) => {
        const factory = new cardType();
        this.piles[deckName].add(...factory.createMany({ count, type, faceUp }));
      });

      this.piles[deckName].cards = this.piles[deckName].cards.sort((a, b) => a.pseudex - b.pseudex);
      this.piles[deckName].shuffle(13);
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
   * Checks loss condition
   */
  isBust() {
    const stamina = this.piles['PLAYER_STAMINA'];
    return stamina && !stamina.cards.length;
  }

  /**
   * Handles card click interthis.ACTIONS based on current game state
   * @param {{card: Card, pile: Pile, slot: Slot}} context
   */
  handleCardClick(context) {
    if ([this.ACTIONS.LOOT_SELECTION.action].includes(this.state)) {
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
   * Returns available this.ACTIONS based on state
   */
  getActions() {
    return this.STATE_ACTIONS[this.state] || [];
  }

  /**
   * Routes and executes a game action based on the provided action key
   * @param {string} action
   * @returns {boolean}
   */
  startAction(action) {
    switch (action) {
      case this.ACTIONS.EXHAUSTED.action:
      case this.ACTIONS.DEFEATED.action:
      case this.ACTIONS.VICTORY.action:
        this.state = 'end';
        return;

      case this.ACTIONS.START.action:
        this.handleInfoScreenClick();
        break;

      case this.ACTIONS.REPLENISH.action:
        this.handleReplenish();
        break;

      case this.ACTIONS.RUN.action:
        this.handleRun();
        break;

      case this.ACTIONS.DRAW_FATE.action:
        this.handleDrawFate();
        break;

      case this.ACTIONS.STASH_LOOT.action:
        this.handleStashLoot();
        break;

      case this.ACTIONS.LOOT_SELECTION.action:
        this.handleLootSelection();
        break;

      case this.ACTIONS.DROP_LOOT.action:
        this.handleLootDrop();
        break;

      case this.ACTIONS.COMBAT.action:
        this.handleCombat();

      case this.ACTIONS.DRAW_STAMINA.action:
        this.handleDrawStamina();
        break;
    }
    this.calculateCombatModifiers();
    this.calculateGameState();
    this.displayDigit();
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
      fromId: 'player-fate',
      toId: 'wrath',
      count: 1,
      faceUp: true,
    });

    let replenishCard;
    if ((replenishCard = this.hasReplenish('wrath', true))) {
      //setTimeout(() => (replenishCard.isSelected = true), 100);
      replenishCard.isSelected;
      this.state = 'replenish_visible';
      return true;
    }

    let lootCard;
    if ((lootCard = this.hasLoot('wrath', true))) {
      //setTimeout(() => (lootCard.isSelected = true), 100);
      lootCard.isSelected;
      this.state = 'loot_visible';
      return true;
    }

    if (this.hasLiveEnemy('wrath')) {
      this.state = 'enemy_visible';
      this.applyDefenceModifier();
    }

    return true;
  }

  handleInfoScreenClick() {
    this.state = 'idle';
  }

  /**
   * Moves all loot from wrath into loot pile and marks them as looted
   * @returns {boolean}
   */
  handleStashLoot() {
    const wrath = this.getPile('wrath');

    for (let i = wrath.cards.length - 1; i >= 0; i--) {
      const card = wrath.cards[i];
      if (card.isLoot) {
        card.looted();
        card.isSelected = false;
        this.deal({ fromId: 'wrath', toId: 'loot', index: i });
      }
    }

    this.state = 'idle';
    return true;
  }

  handleReplenish() {
    const wrath = this.getPile('wrath');
    if (wrath.cards.some((c) => c.isReplenish)) {
      for (let i = wrath.cards.length - 1; i >= 0; i--) {
        const card = wrath.cards[i];
        if (card.isReplenish) {
          const { replenish } = card;

          this.deal({
            fromId: replenish.type,
            toId: replenish.to,
            count: replenish.value,
          });
          this.deal({
            fromPile: wrath,
            toId: 'discardFate',
            index: i,
          });
        }
      }
      this.state = 'idle';
      return true;
    } else {
      const combat = this.getPile('combat');

      for (let i = combat.cards.length - 1; i >= 0; i--) {
        const card = combat.cards[i];
        if (card?.isReplenish && card?.isSelected) {
          const { replenish } = card;
          const deal = {
            fromId: replenish.type,
            toId: replenish.to,
            count: replenish.value,
          };
          this.deal(deal);
          this.deal({
            fromPile: combat,
            toId: 'discardStamina',
            count: combat.cards.length,
          });
        }
      }
      this.state = 'idle';
      return true;
    }
  }

  handleLootDrop() {
    this.deal({
      fromId: 'combat',
      toId: 'discardStamina',
      count: this.getPile('combat').cards.length,
    });

    Object.values(this.piles).forEach((pile) => {
      if (pile.slot?.expectsSelection) pile.slot.toggleExpectsSelection(false);
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

    if (!combatPile.cards.some((card) => card.isSelected)) return true;

    for (let i in combatPile.cards) {
      i = parseInt(i);
      const combatCard = combatPile.cards[i];

      if (!combatCard.isSelected) continue;

      // --- loot ---
      if (combatCard.isLoot) {
        combatCard.looted();
        combatCard.isSelected = false;

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
      if (combatCard.isReplenish) {
        this.handleReplenish();
      }
    }

    return true;
  }

  /**
   * Enters combat state
   * @returns {boolean}
   */
  handleCombat() {
    this.state = this.ACTIONS.COMBAT.action;
    return true;
  }

  /**
   * Draws stamina into combat and resolves combat outcome
   * @returns {boolean}
   */
  async handleDrawStamina() {
    this.deal({
      fromId: 'player-stamina',
      toId: 'combat',
      count: 1,
      faceUp: true,
    });
    this.applyAttackModifiers();
    const combatPile = this.getPile('combat');

    if (this.isEnemyDefeated()) {
      this.getPile('wrath').cards.forEach((card, index) => {
        if (card.isEnemy && card.liveEnemy) {
          card.defeated();
          this.deal({ fromId: 'wrath', toId: 'discardWrath', index });
        }
      });

      setTimeout(() => {
        if (combatPile.cards.length === 1) {
          this.handleCardClick({ card: combatPile.cards[0], pile: combatPile, slot: combatPile.slot });
        }
      }, 100);

      this.state = this.ACTIONS.LOOT_SELECTION.action;
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
  hasLoot(pileId, reference = false) {
    const pile = this.getPile(pileId);
    if (!pile) return false;

    return reference ? pile.cards.find((card) => card.isLoot) : pile.cards.some((card) => card.isLoot);
  }

  /**
   * Returns true if pile contains any loot
   * @param {string} pileId
   */
  hasReplenish(pileId, reference = false) {
    const pile = this.getPile(pileId);
    if (!pile) return false;

    return reference ? pile.cards.find((card) => card.isReplenish) : pile.cards.some((card) => card.isReplenish);
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

    return combatSum >= wrathSum + this.abacusValue;
  }

  calculateGameState() {
    const discardWrath = this.getPile('discardWrath').getSum();

    const lootSum = this.getPile('loot').getSum();
    const fateCards = this.getPile('player-fate').cards.length;
    const staminaCards = this.getPile('player-stamina').cards.length;

    this.abacusValue = discardWrath;
    this.getPile('I').slot.overrideSum = discardWrath;
    this.getPile('wrath').slot.overrideSum = discardWrath + this.getPile('wrath').getSum();

    if (lootSum >= VICTORY_GEMS) {
      this.ACTIONS.VICTORY.data = { gems: lootSum };
      this.state = this.ACTIONS.VICTORY.action;
    } else if (fateCards <= 0) {
      this.state = this.ACTIONS.EXHAUSTED.action;
    } else if (staminaCards <= 0) {
      this.state = this.ACTIONS.DEFEATED.action;
    }
  }

  cardAbacus = new CardAbacus();

  abacusValue = 0;

  displayDigit() {
    const operations = this.cardAbacus.update(this.abacusValue);
    for (let { pile, count, type } of operations) {
      const targetPile = this.getPile(pile);
      const discard = `${pile}discard`;
      this.getPile(discard).cards.forEach((card) => {
        card.isSelected = false;
        card.rotation = 0;
      });

      switch (type) {
        case 'add_I':
          this.deal({ fromId: `${pile}discard`, toPile: targetPile, count });
          break;
        case 'sub_I':
          this.deal({ toId: `${pile}discard`, fromPile: targetPile, count });
          break;
        case 'add_V':
          this.deal({ fromId: `${pile}discard`, toPile: targetPile, count });
          targetPile.cards[0].isSelected = true;
          break;
        case 'sub_V':
          const selectedCard = targetPile.cards.find((card) => card.isSelected);
          this.deal({ toId: `${pile}discard`, fromPile: targetPile, index: selectedCard });
          targetPile.cards.forEach((card) => {
            card.isSelected = false;
          });
          break;
      }
    }
  }
}

export { House };
