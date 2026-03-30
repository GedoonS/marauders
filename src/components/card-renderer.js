import * as PIXI from 'pixi.js';
import { CARDWIDTH } from './config';

const cardBaseSize = CARDWIDTH;

const borderColors = {
  fate: 0x663300,
};

class CardRenderer {
  constructor({ textures, container }) {
    this.textures = textures;
    this.container = container;
  }

  async render(card, x, y) {
    // If already rendered, just move it
    if (card.container) {
      card.container.x = x;
      card.container.y = y;
      return;
    }

    const textureUrl = this.textures[card.graphicId];
    if (!textureUrl) return;

    const borderColor = borderColors[card.type];

    const texture = await PIXI.Assets.load(textureUrl);
    const sprite = new PIXI.Sprite(texture);

    sprite.width = cardBaseSize;
    sprite.height = (cardBaseSize * 3) / 2;

    // --- Create card container ---
    const cardContainer = new PIXI.Container();
    cardContainer.x = x;
    cardContainer.y = y;

    // --- Mask ---
    const radius = cardBaseSize / 10;
    const mask = new PIXI.Graphics().roundRect(0, 0, sprite.width, sprite.height, radius).fill(0xffffff);

    sprite.mask = mask;

    // --- Border ---
    const border = new PIXI.Graphics()
      .roundRect(-2, -2, sprite.width + 4, sprite.height + 4, radius + 2)
      .fill(borderColor)
      .stroke(0x000000);

    // --- Assemble ---
    cardContainer.addChild(border);
    cardContainer.addChild(mask);
    cardContainer.addChild(sprite);

    this.container.addChild(cardContainer);

    // Store reference on the card
    card.container = cardContainer;
  }
}

export { CardRenderer };
