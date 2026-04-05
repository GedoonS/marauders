import * as PIXI from 'pixi.js';
import { Slot } from './slot';
import { BASEUNIT, CARDHEIGHT, WIDTH, HEIGHT, AAA_SCALING, FONT_FAMILY, PILE_TYPE_MAP } from './config';
import { InfoScreen } from './info-screen';

const infoScreenVisibleStates = ['start', 'victory', 'exhausted', 'defeated'];
/**
 * Represents the visual layout of piles on screen
 */
class Table {
  constructor({ app, textures, house }) {
    this.slots = {}; // { slotId: Slot }
    this.textures = textures;

    // Container for all slots
    this.container = new PIXI.Container();
    this.container.x = 0;
    this.container.y = 0;
    this.house = house;
    this.app = app;

    // Container just for action buttons
    this.actionsContainer = new PIXI.Container();
    this.container.addChild(this.actionsContainer);
    this.actionsContainer.x = BASEUNIT * 56;
    this.actionsContainer.y = BASEUNIT * 26;
    this.app.stage.addChild(this.container);
    this.cardClickListener = this.cardClickListener.bind(this);
    this.handleInfoScreenClick = this.handleInfoScreenClick.bind(this);
    document.addEventListener('game:cardPicked', this.cardClickListener);
  }

  /**
   * Adds a slot to the table
   * @param {Object} params
   * @param {string} params.id
   * @param {number} params.x
   * @param {number} params.y
   * @param {number} params.width
   * @param {number} params.height
   * @param {'fan'|'singles'} params.layout
   */
  addSlot({ id, x, y, width, height, layout = 'fan', pile, rotate = false, reverse = false, subtypeAllowed = null, maxCards = -1 }) {
    const slot = new Slot({
      id,
      x,
      y,
      width,
      height,
      layout,
      parentContainer: this.container,
      textures: this.textures,
      pile,
      rotate,
      reverse,
      app: this.app,
      table: this,
      subtypeAllowed,
      maxCards,
    });

    this.slots[id] = slot;
  }

  /**
   * Assign a pile to a slot
   * @param {string} slotId
   * @param {Pile} pile
   */
  setPile(slotId, pile) {
    const slot = this.getSlot(slotId);
    if (!slot) return;
    slot.setPile(pile);
  }

  /**
   * Constructs and lays out all slots on the table
   */
  constructTable() {
    const topAreaHeight = CARDHEIGHT * 2 + BASEUNIT;
    const centerColumnWidth = Math.floor((WIDTH - (6 * BASEUNIT + 2 * CARDHEIGHT)) / BASEUNIT) * BASEUNIT;
    const centerColumnLeftSide = CARDHEIGHT + 3 * BASEUNIT;

    this.addSlot({
      id: 'wrath',
      pile: this.house.piles.wrath,
      x: centerColumnLeftSide,
      y: BASEUNIT,
      width: centerColumnWidth,
      height: CARDHEIGHT,
      layout: 'evenodd',
    });

    this.addSlot({
      id: 'combat',
      pile: this.house.piles.combat,
      x: centerColumnLeftSide,
      y: CARDHEIGHT + 2 * BASEUNIT,
      width: centerColumnWidth,
      height: CARDHEIGHT,
    });

    this.addSlot({
      id: 'player-fate',
      pile: this.house.piles['player-fate'],
      x: centerColumnLeftSide + centerColumnWidth + BASEUNIT * 1.5,
      y: BASEUNIT,
      width: topAreaHeight,
      height: CARDHEIGHT,
      rotate: true,
    });

    this.addSlot({
      id: 'player-stamina',
      pile: this.house.piles['player-stamina'],
      x: BASEUNIT * 1.5,
      y: BASEUNIT,
      width: topAreaHeight,
      height: CARDHEIGHT,
      rotate: true,
    });

    this.addSlot({
      id: 'loot',
      pile: this.house.piles.loot,
      x: BASEUNIT,
      y: topAreaHeight + 2 * BASEUNIT,
      width: CARDHEIGHT,
      height: CARDHEIGHT,
      rotate: true,
      reverse: true,
    });

    this.addSlot({
      id: 'trinketLeft',
      pile: this.house.piles.trinketLeft,
      x: centerColumnLeftSide,
      y: topAreaHeight + 2 * BASEUNIT,
      width: CARDHEIGHT / 2 - BASEUNIT,
      height: CARDHEIGHT,
      rotate: true,
      subtypeAllowed: PILE_TYPE_MAP['trinketLeft'],
      maxCards: 1,
    });

    this.addSlot({
      id: 'gearLeftHand',
      pile: this.house.piles.gearLeftHand,
      x: centerColumnLeftSide,
      y: topAreaHeight + CARDHEIGHT / 2 + BASEUNIT,
      width: CARDHEIGHT / 2 + BASEUNIT,
      height: CARDHEIGHT,
      rotate: true,
      subtypeAllowed: 'hand',
      subtypeAllowed: PILE_TYPE_MAP['gearLeftHand'],
      maxCards: 1,
    });

    this.addSlot({
      id: 'gearHead',
      pile: this.house.piles.gearHead,
      x: (WIDTH - CARDHEIGHT) / 2,
      y: topAreaHeight + BASEUNIT * 2,
      width: CARDHEIGHT / 2 - BASEUNIT,
      height: CARDHEIGHT,
      rotate: true,
      subtypeAllowed: PILE_TYPE_MAP['gearHead'],
      maxCards: 1,
    });

    this.addSlot({
      id: 'gearBody',
      pile: this.house.piles.gearBody,
      x: (WIDTH - CARDHEIGHT) / 2,
      y: topAreaHeight + CARDHEIGHT / 2 + BASEUNIT,
      width: CARDHEIGHT / 2 + BASEUNIT,
      height: CARDHEIGHT,
      rotate: true,
      subtypeAllowed: PILE_TYPE_MAP['gearBody'],
      maxCards: 1,
    });

    this.addSlot({
      id: 'trinketRight',
      pile: this.house.piles.trinketRight,
      x: centerColumnLeftSide + centerColumnWidth - CARDHEIGHT,
      y: topAreaHeight + BASEUNIT * 2,
      width: CARDHEIGHT / 2 - BASEUNIT,
      height: CARDHEIGHT,
      rotate: true,
      subtypeAllowed: PILE_TYPE_MAP['trinketRight'],
      maxCards: 1,
    });

    this.addSlot({
      id: 'gearRightHand',
      pile: this.house.piles.gearRightHand,
      x: centerColumnLeftSide + centerColumnWidth - CARDHEIGHT,
      y: topAreaHeight + CARDHEIGHT / 2 + BASEUNIT,
      width: CARDHEIGHT / 2 + BASEUNIT,
      height: CARDHEIGHT,
      rotate: true,
      subtypeAllowed: PILE_TYPE_MAP['gearRightHand'],
      maxCards: 1,
    });

    this.infoScreen = new InfoScreen({
      visible: false,
      state: 'start',
      textures: this.textures,
      app: this.app,
      clickHandler: this.handleInfoScreenClick,
    });
  }

  /**
   * Returns slot by id
   * @param {string} slotId
   */
  getSlot(slotId) {
    return this.slots[slotId] || null;
  }

  /**
   * Renders all slots and UI elements
   */
  render() {
    Object.values(this.slots).forEach((slot) => slot.render());
    this.renderActions();
  }

  /**
   * Renders available action buttons based on current house state
   */
  renderActions() {
    // Clear old buttons
    this.actionsContainer.removeChildren();

    const actions = this.house.getActions();

    const buttonWidth = CARDHEIGHT;
    const buttonHeight = 2 * BASEUNIT;
    const gap = BASEUNIT;

    actions.forEach((actionObj, index) => {
      const x = BASEUNIT;
      const y = buttonHeight - BASEUNIT + index * (buttonHeight + gap);

      // --- Button background ---
      const bg = actionObj.message
        ? new PIXI.Graphics().roundRect(0, 0, buttonWidth, buttonHeight, BASEUNIT / 2).fill(0xffffff)
        : new PIXI.Graphics()
            .roundRect(0, 0, buttonWidth, buttonHeight, BASEUNIT / 2)
            .fill(0x000000)
            .stroke({ width: 2, color: 0xffffff });

      // --- Label ---
      const text = new PIXI.Text({
        text: actionObj.label,
        style: {
          fill: actionObj.message ? 0x000000 : 0xffffff,
          fontSize: BASEUNIT * AAA_SCALING,
          fontFamily: FONT_FAMILY,
          fontWeight: 'bold',
        },
      });

      text.anchor.set(0.5);
      text.x = buttonWidth / 2;
      text.y = buttonHeight / 2;

      text.scale.y = 1 / AAA_SCALING;
      text.scale.x = 1 / AAA_SCALING;

      // --- Button container ---
      const button = new PIXI.Container();
      button.x = x;
      button.y = y;

      button.addChild(bg);
      button.addChild(text);

      // --- Interaction ---
      button.eventMode = 'static';
      button.cursor = 'pointer';

      button.on('pointerdown', async () => {
        await this.house.startAction(actionObj.action);
        this.render();
      });

      this.actionsContainer.addChild(button);

      if (infoScreenVisibleStates.includes(actionObj.action)) {
        console.log({ actionObj });
        this.updateInfoScreen(actionObj.data);
      }
    });
  }

  /**
   * Finds the current context (card, pile, slot) for a given card instance
   * @param {Card} targetCard
   * @returns {{card: Card, pile: Pile, slot: Slot}|null}
   */
  findCardContext(targetCard) {
    for (const slot of Object.values(this.slots)) {
      const pile = slot.pile;

      const card = pile.cards.find((c) => c === targetCard);
      if (card) {
        return { card, pile, slot };
      }
    }
    return null;
  }

  /**
   * Handles global card click events and forwards them to the house logic
   * @param {CustomEvent} event
   */
  cardClickListener(event) {
    const { card } = event.detail;

    const context = this.findCardContext(card);
    if (!context) return;

    this.house.handleCardClick(context);

    this.render();
  }

  unselectSlots(ignoreSlot) {
    Object.values(this.slots).forEach((slot) => {
      if (slot !== ignoreSlot) slot.toggleSelected(false);
    });
  }

  updateInfoScreen(data) {
    const infoScreenVisibility = infoScreenVisibleStates.includes(this.house.state);
    this.infoScreen.updateVisibility(infoScreenVisibility);
    this.infoScreen.setState({ state: this.house.state, data });
  }

  handleInfoScreenClick() {
    const actions = this.house.getActions();
    this.house.startAction(actions[0].action);
    this.updateInfoScreen();
    this.render();
  }
}

export { Table };
