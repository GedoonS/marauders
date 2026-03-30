import * as PIXI from 'pixi.js';
import { Slot } from './slot';
import { BASEUNIT, CARDHEIGHT, WIDTH } from './config';

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

    app.stage.addChild(this.container);
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
  addSlot({ id, x, y, width, height, layout = 'fan', pile, rotate = false, reverse = false }) {
    console.log(id);
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
      id: 'playerFate',
      pile: this.house.piles.playerFate,
      x: centerColumnLeftSide + centerColumnWidth + BASEUNIT * 2,
      y: BASEUNIT,
      width: topAreaHeight,
      height: CARDHEIGHT,
      rotate: true,
    });

    this.addSlot({
      id: 'playerStamina',
      pile: this.house.piles.playerStamina,
      x: BASEUNIT,
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
      id: 'leftGear',
      pile: this.house.piles.leftGear,
      x: centerColumnLeftSide,
      y: topAreaHeight + 2 * BASEUNIT,
      width: CARDHEIGHT,
      height: CARDHEIGHT,
      rotate: true,
      reverse: true,
    });

    this.addSlot({
      id: 'centerGear',
      pile: this.house.piles.centerGear,
      x: (WIDTH - CARDHEIGHT) / 2,
      y: topAreaHeight + BASEUNIT * 2,
      width: CARDHEIGHT,
      height: CARDHEIGHT,
      rotate: true,
      reverse: true,
    });

    this.addSlot({
      id: 'rightGear',
      pile: this.house.piles.rightGear,
      x: centerColumnLeftSide + centerColumnWidth - CARDHEIGHT,
      y: topAreaHeight + BASEUNIT * 2,
      width: CARDHEIGHT,
      height: CARDHEIGHT,
      rotate: true,
      reverse: true,
    });
  }

  /**
   * Returns slot by id
   * @param {string} slotId
   */
  getSlot(slotId) {
    return this.slots[slotId] || null;
  }

  render() {
    Object.values(this.slots).forEach((slot) => slot.render());
  }
}

export { Table };
