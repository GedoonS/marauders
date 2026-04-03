import * as PIXI from 'pixi.js';
import { CARDWIDTH, BASEUNIT } from './config';
import { Card } from './card';

const cardBaseSize = CARDWIDTH;

const eventEmitter = (card) => {
  const evt = new CustomEvent('game:cardPicked', {
    detail: {
      card, // pass the actual object
    },
  });
  document.dispatchEvent(evt);
};

// Layout definitions
const cardLayouts = {
  weapon: [
    { prop: 'spirit', x: 4, y: 2, rotate: 0, fontSize: 1.5 },
    { prop: 'combat.add', x: 1.4, y: 10.75, rotate: 270 },
    { prop: 'combat.multiply', x: 1.4, y: 10.75, rotate: 270 },
  ],
  enemy: [
    { prop: 'spirit', x: 1.4, y: 1.2, rotate: 0 },
    { prop: 'wrath', x: 6.65, y: 10.75, rotate: 180 },
  ],
  loot: [
    { prop: 'spirit', x: 4, y: 2, rotate: 0, fontSize: 1.5 },
    { prop: 'lootValue', x: 1.3, y: 10.75, rotate: 270 },
  ],
  lootFate: [
    //{ prop: 'spirit', x: 4, y: 2, rotate: 0, fontSize: 1.5 },
    { prop: 'lootValue', x: 1.3, y: 10.75, rotate: 270 },
  ],
};

class CardRenderer {
  constructor({ textures, container, app }) {
    this.textures = textures;
    this.container = container;
    this.app = app;
    this.cardBackCache = {
      fate: null,
      stamina: null,
    };
  }

  /**
   *
   * @param {Card} card - card to be drawn
   * @param {number} x - position
   * @param {number} y -position
   * @returns
   */
  async render(card, x, y) {
    if (!card) return;
    if (card.faceUp) {
      if (card.container) {
        card.targetX = x;
        card.targetY = y;
        card.animateMovement();
        return;
      }

      const graphicId = card.faceUp ? card.graphicId : `${card.type}-back`;

      const textureUrl = this.textures[graphicId];
      if (!textureUrl) return;

      const texture = await PIXI.Assets.load(textureUrl);
      const sprite = new PIXI.Sprite(texture);

      sprite.width = Math.floor(cardBaseSize);
      sprite.height = Math.floor((cardBaseSize * 3) / 2);

      // --- Create card container ---
      const cardContainer = new PIXI.Container();
      cardContainer.x = x;
      cardContainer.y = y;
      card.targetX = x;
      card.targetY = y;
      card.x = x;
      card.y = y;

      cardContainer.pivot.set(sprite.width / 2, sprite.height / 2);

      cardContainer.eventMode = 'static';
      cardContainer.cursor = 'pointer';
      cardContainer.on('pointerdown', () => eventEmitter(card));

      // --- Mask ---
      const radius = cardBaseSize / 10;
      const mask = new PIXI.Graphics().roundRect(0, 0, sprite.width, sprite.height, radius).fill(0xffffff);

      sprite.mask = mask;

      // --- Border ---
      const border = new PIXI.Graphics()
        .roundRect(-1, -1, sprite.width + 2, sprite.height + 2, radius)
        .fill({ color: 0x000000, alpha: 0.5 });
      //.stroke(0x000000);

      // --- Assemble ---
      cardContainer.addChild(border);
      cardContainer.addChild(mask);
      cardContainer.addChild(sprite);

      // Print labels
      if (card.faceUp) this.printLabels(card, cardContainer);
      // Store reference on the card
      card.container = cardContainer;

      this.container.addChild(cardContainer);
    } else {
      await this.renderCardBack(card, x, y);
    }
  }
  /**
   * Render a face-down card
   * @param {Card} card
   * @param {number} x
   * @param {number} y
   */
  async renderCardBack(card, x, y) {
    if (card.backContainer) {
      card.targetX = x;
      card.targetY = y;
      card.animateMovement();

      return;
    }

    const graphicId = `${card.type}-back`;

    const textureUrl = this.textures[graphicId];
    if (!textureUrl) return;

    const texture = await PIXI.Assets.load(textureUrl);
    const sprite = new PIXI.Sprite(texture);

    sprite.width = Math.floor(cardBaseSize);
    sprite.height = Math.floor((cardBaseSize * 3) / 2);

    // --- Create card container ---
    const cardContainer = new PIXI.Container();
    cardContainer.x = x;
    cardContainer.y = y;
    cardContainer.eventMode = 'passive';

    cardContainer.pivot.set(sprite.width / 2, sprite.height / 2);
    // --- Mask ---
    const radius = cardBaseSize / 10;
    const mask = new PIXI.Graphics().roundRect(0, 0, sprite.width, sprite.height, radius).fill(0xffffff);

    sprite.mask = mask;

    // --- Border ---
    const border = new PIXI.Graphics().roundRect(-1, -1, sprite.width + 2, sprite.height + 2, radius).fill({ color: 0x000000, alpha: 0.5 });
    //.stroke(0x000000);

    // --- Assemble ---
    cardContainer.addChild(border);
    cardContainer.addChild(mask);
    cardContainer.addChild(sprite);

    // Store reference on the card
    card.backContainer = cardContainer;

    this.container.addChild(cardContainer);
  }

  /**
   * Print labels / text on the card according to its layout.
   * @param {Card} card
   * @param {PIXI.Container} cardContainer
   */
  printLabels(card, cardContainer) {
    const layout = cardLayouts[card.layout] ?? [];
    const antiAntiAliasingScaling = 4;

    layout.forEach((item) => {
      let value = item.prop.split('.').reduce((o, k) => o?.[k], card);
      if (value === undefined) return;

      if (item.prop.includes('.add')) value = `+${value}`;
      if (item.prop.includes('.multiply')) value = `×${value}`;

      const fontSize = (item.fontSize || 1) * BASEUNIT;
      const text = new PIXI.Text({
        text: value,
        style: {
          fontSize: fontSize * antiAntiAliasingScaling,
          fill: 0xffffff,
          resolution: 1,
        },
      });
      text.x = item.x * BASEUNIT;
      text.y = item.y * BASEUNIT;
      text.scale.y = 1 / antiAntiAliasingScaling;
      text.scale.x = 1 / antiAntiAliasingScaling;
      text.rotation = (item.rotate * Math.PI) / 180;
      text.anchor.set(0.5, 0.5);

      cardContainer.addChild(text);
    });
  }
}

export { CardRenderer };
