import { CardRenderer } from './card-renderer';
import * as PIXI from 'pixi.js';
import { CARDWIDTH, CARDHEIGHT, BASEUNIT } from './config';

class Slot {
  maxCards = 0;

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
  constructor({ id, x, y, width, height, layout = 'fan', parentContainer, pile, textures, rotate, reverse, app }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.layout = layout;
    this.pile = pile;
    this.rotate = rotate;
    this.reverse = reverse;
    this.app = app;

    // Create a container for this slot
    this.parentContainer = parentContainer;
    this.container = new PIXI.Container();
    this.container.x = x + CARDWIDTH / 2;
    this.container.y = y + CARDHEIGHT / 2;
    if (this.rotate) {
      this.container.rotation = Math.PI / 2;
      this.container.x += BASEUNIT * 2;
      this.container.y -= BASEUNIT * 2;
    }

    this.parentContainer.addChild(this.container);

    this.cardRenderer = new CardRenderer({
      container: this.container,
      textures,
      app: this.app,
    });
  }

  async render() {
    this.maxCards = Math.max(this.maxCards, this.pile.cards.length);
    let index = 0;
    const cardSpacing = (this.width - CARDWIDTH) / Math.max(1, this.maxCards - 1);
    for (const card of this.pile.cards) {
      const cardOffset = Math.floor(this.reverse ? this.width - CARDWIDTH - index * cardSpacing : index * cardSpacing);
      await this.cardRenderer.render(card, cardOffset, 0);
      index++;
    }
    this.renderSum();
  }

  renderSum() {
    if (['wrath', 'combat', 'loot'].includes(this.id)) {
      // --- Draw pile sum in lower right corner ---
      const sum = this.pile.getSum();
      if (!this.sumText) {
        this.sumText = new PIXI.Text({
          text: sum,
          style: {
            fontSize: BASEUNIT * 1,
            fill: 0xffffff,
            stroke: 0x000000,
          },
        });
        this.sumText.anchor.set(0.5, 0.5); // bottom right

        if (this.rotate) {
          this.sumText.rotation -= Math.PI / 2;
          //this.container.x += CARDHEIGHT;
          this.sumText.y = -this.width / 2 - BASEUNIT; //this.height;
          this.sumText.x = this.height / 2 + BASEUNIT * 2; //this.height; // - CARDHEIGHT / 2 + BASEUNIT * 2;
        } else {
          this.sumText.x = this.width - CARDHEIGHT / 2 + BASEUNIT * 1.5;
          this.sumText.y = this.height - BASEUNIT * 1.5 - CARDWIDTH / 2;
        }

        this.container.addChild(this.sumText);
      } else {
        this.sumText.text = sum;
      }

      //if (this.sumText) this.sumText.alpha = sum > 0 ? 1 : 0;
    }
  }
}

export { Slot };
