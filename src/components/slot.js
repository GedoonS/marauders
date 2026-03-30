import { CardRenderer } from './card-renderer';
import * as PIXI from 'pixi.js';
import { CARDWIDTH, CARDHEIGHT } from './config';

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
  constructor({ id, x, y, width, height, layout = 'fan', parentContainer, pile, textures, rotate, reverse }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.layout = layout;
    this.pile = pile;
    this.rotate = rotate;
    this.reverse = reverse;

    // Create a container for this slot
    this.parentContainer = parentContainer;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    if (this.rotate) {
      this.container.rotation = Math.PI / 2;
      this.container.x += CARDHEIGHT;
    }

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
    const cardSpacing = (this.width - CARDWIDTH) / (this.pile.cards.length - 1);
    for (const card of this.pile.cards) {
      const cardOffset = this.reverse ? this.width - CARDWIDTH - index * cardSpacing : index * cardSpacing;
      await this.cardRenderer.render(card, cardOffset, 0);
      index++;
    }
  }
}

export { Slot };
