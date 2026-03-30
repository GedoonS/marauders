import { CardRenderer } from './card-renderer';
import * as PIXI from 'pixi.js';

class Slot {
  /**
   * @param {Object} params
   * @param {string} params.id
   * @param {number} params.x
   * @param {number} params.y
   * @param {number} params.width
   * @param {number} params.height
   * @param {Pile} params.pile
   * @param {'fan'|'singles'} params.layout
   * @param {PIXI.Container} params.parentContainer - Table container
   * @param {PIXI.app} params.app - parent app
   */
  constructor({ id, x, y, width, height, layout = 'fan', parentContainer, pile, textures }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.layout = layout;
    this.pile = pile;

    // Create a container for this slot
    this.parentContainer = parentContainer;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    this.parentContainer.addChild(this.container);

    this.cardRenderer = new CardRenderer({
      container: this.container,
      textures,
    });
    console.log('Im a slot, I have a pile', this.pile);
    this.render();
  }

  async render() {
    let index = 0;
    const cardSpacing = this.width / this.pile.cards.length;
    for (const card of this.pile.cards) {
      await this.cardRenderer.render(card, index * cardSpacing, 0);
      index++;
    }
  }
}

export { Slot };
