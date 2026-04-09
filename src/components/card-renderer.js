import * as PIXI from 'pixi.js';
import { CARDWIDTH, CARDHEIGHT, BASEUNIT, AAA_SCALING, FONT_FAMILY } from './config';
import { Card } from './card';

const cardBaseSize = CARDWIDTH;
const radius = CARDWIDTH / 10;

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
    { prop: 'combat.add', x: 1.3, y: 10.75, rotate: 270, fontSize: 0.8 },
    { prop: 'combat.sub', x: 1.3, y: 10.75, rotate: 270, fontSize: 0.8 },
    { prop: 'combat.div', x: 1.3, y: 10.75, rotate: 270 },
    { prop: 'combat.mult', x: 1.3, y: 10.75, rotate: 270 },
  ],
  enemy: [
    { prop: 'spirit', x: 1.4, y: 1.2, rotate: 0 },
    //{ prop: 'wrath', x: 6.65, y: 10.75, rotate: 180 },
    // { prop: 'wrath', x: 1, y: 10.75, rotate: 180 },
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

      const texture = this.textures[graphicId];
      if (!texture) return;

      const sprite = new PIXI.Sprite(texture);

      sprite.width = Math.floor(cardBaseSize);
      sprite.height = Math.floor((cardBaseSize * 3) / 2);

      // --- Create card container ---
      const cardContainer = new PIXI.Container();
      cardContainer.x = x;
      cardContainer.y = y;
      card.targetX = x;
      card.targetY = y;

      const containerLocal = this.container.toLocal({ x: card.oldX ?? 0, y: card.oldY ?? 0 });
      card.x = cardContainer.x = containerLocal.x;
      card.y = cardContainer.y = containerLocal.y;
      card.rotation = card.oldRotate - this.container.rotation;

      cardContainer.pivot.set(sprite.width / 2, sprite.height / 2);

      cardContainer.eventMode = 'static';
      cardContainer.cursor = 'pointer';
      cardContainer.on('pointerdown', () => eventEmitter(card));

      // --- Mask ---
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
      if (card.faceUp) {
        this.printLabels(card, cardContainer);
        this.initModifierLabel(card, cardContainer);
      }
      // Store reference on the card
      card.container = cardContainer;

      this.container.addChild(cardContainer);
      card.animateAlpha();
      card.animateRotation();
      card.animateMovement();
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

    const texture = this.textures[graphicId];
    if (!texture) return;

    const sprite = new PIXI.Sprite(texture);

    sprite.width = Math.floor(cardBaseSize);
    sprite.height = Math.floor((cardBaseSize * 3) / 2);

    // --- Create card container ---
    const cardContainer = new PIXI.Container();
    cardContainer.x = x;
    cardContainer.y = y;
    cardContainer.rotation = card.oldRotate || card.targetRotation;
    cardContainer.eventMode = 'passive';
    card.rotation = card.targetRotation;
    card.targetX = x;
    card.targetY = y;

    const containerLocal = this.container.toLocal({ x: card.oldX ?? 0, y: card.oldY ?? 0 });

    card.x = cardContainer.x = containerLocal.x;
    card.y = cardContainer.y = containerLocal.y;

    cardContainer.pivot.set(sprite.width / 2, sprite.height / 2);
    // --- Mask ---
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
    card.animateAlpha();
    card.animateMovement();

    this.container.addChild(cardContainer);
  }

  /**
   * Print labels / text on the card according to its layout.
   * @param {Card} card
   * @param {PIXI.Container} cardContainer
   */
  printLabels(card, cardContainer) {
    const layout = cardLayouts[card.layout] ?? [];

    layout.forEach((item) => {
      let value = item.prop.split('.').reduce((o, k) => o?.[k], card);
      if (value === undefined) return;

      const domain = Math.floor(Math.log10(value));
      let fontScale = 1;
      if (domain > 1) fontScale = 0.8;

      if (item.prop.includes('.add')) value = `+${value}`;
      if (item.prop.includes('.sub')) value = `+${value}`;
      if (item.prop.includes('.mult')) value = `×${value}`;
      if (item.prop.includes('.div')) value = `×${value}`;

      const fontSize = (item.fontSize || 1) * BASEUNIT * fontScale;
      const text = new PIXI.Text({
        text: value,
        style: {
          fontSize: fontSize * AAA_SCALING,
          fill: 0xffffff,
          resolution: 1,
          fontFamily: FONT_FAMILY,
          fontWeight: 'bold',
        },
      });
      text.x = item.x * BASEUNIT;
      text.y = item.y * BASEUNIT;
      text.scale.y = 1 / AAA_SCALING;
      text.scale.x = 1 / AAA_SCALING;
      text.rotation = (item.rotate * Math.PI) / 180;
      text.anchor.set(0.5, 0.5);

      cardContainer.addChild(text);
    });
  }

  /**
   * Initialize a modifier label slot for a card (hidden by default)
   * @param {Card} card
   */
  initModifierLabel(card, cardContainer) {
    //if (!card.container || card.modifierLabel) return;

    const labelContainer = new PIXI.Container();
    const width = (CARDWIDTH * 3) / 4;
    const height = 2 * BASEUNIT;

    const shadow = new PIXI.Graphics().roundRect(0, 0, width, height, radius).fill(0xffffff);
    const bg = new PIXI.Graphics().roundRect(1, 1, width - 2, height - 2, radius).fill(0x555555);
    bg.tint = 0x00ff00;

    const labelText = new PIXI.Text({
      text: '',
      style: {
        fontSize: BASEUNIT * AAA_SCALING,
        fill: 0xffffff,
        align: 'center',
        fontWeight: 'bold',
        fontFamily: FONT_FAMILY,
      },
    });
    labelText.anchor.set(0.5, 0.5);
    labelText.x = width / 2;
    labelText.y = height / 2;

    labelText.scale.y = 1 / AAA_SCALING;
    labelText.scale.x = 1 / AAA_SCALING;

    labelContainer.addChild(shadow);
    labelContainer.addChild(bg);

    labelContainer.addChild(labelText);

    labelContainer.x = CARDWIDTH / 4;
    labelContainer.y = CARDHEIGHT - 2 * BASEUNIT;

    labelContainer.visible = false;

    cardContainer.addChild(labelContainer);

    card.modifierLabel = {
      container: labelContainer,
      textObj: labelText,
      bg,
    };
  }
}

export { CardRenderer };
