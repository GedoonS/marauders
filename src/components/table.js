import * as PIXI from 'pixi.js';
import { Slot } from './slot';

/**
 * Represents the visual layout of piles on screen
 */
class Table {
  constructor({ app, textures }) {
    this.slots = {}; // { slotId: Slot }
    this.textures = textures;

    // Container for all slots
    this.container = new PIXI.Container();
    this.container.x = 0;
    this.container.y = 0;

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
  addSlot({ id, x, y, width, height, layout = 'fan', pile }) {
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
