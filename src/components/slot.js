import { CardRenderer } from './card-renderer';
import * as PIXI from 'pixi.js';
import { CARDWIDTH, CARDHEIGHT, BASEUNIT, AAA_SCALING, FONT_FAMILY } from './config';
import { Table } from './table';

const selectables = ['trinketLeft', 'gearLeftHand', 'gearHead', 'gearBody', 'trinketRight', 'gearRightHand'];
class Slot {
  maxCards = 0;
  isSelected = false;
  ticker = PIXI.Ticker.shared;

  alphaAnimation = {
    counter: 0,
    isAnimating: false,
    speed: 0.03, // tweak to make it faster or slower
  };

  /**
   * @param {Object} params
   * @param {string} params.id
   * @param {number} params.x
   * @param {number} params.y
   * @param {number} params.width
   * @param {number} params.height
   * @param {Pile} params.pile
   * @param {'fan'|'singles'|'evenodd'} params.layout
   * @param {PIXI.Container} params.parentContainer - Table container
   * @param {PIXI.app} params.app - parent app
   * @param {string|null} [params.subtypeAllowed=null] - Accepted subtypes for this pile (for example 'hand', 'helmet'
   * @param {Table} params.table
   * @param {boolean} snaking - whether to stagger the pile or not
   */
  constructor({
    id,
    x,
    y,
    width,
    height,
    layout = 'fan',
    parentContainer,
    pile,
    textures,
    rotate,
    reverse,
    app,
    table,
    subtypeAllowed = null,
    maxCards = -1,
    snaking,
    defaultCardsLength,
    outline,
  }) {
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
    this.table = table;
    this.subtypeAllowed = subtypeAllowed;
    this.maxCards = maxCards;
    this.snaking = snaking;
    this.outlineShow = outline;
    if (defaultCardsLength) this.maxCardsInPile = defaultCardsLength;

    this.pile.setParentSlot(this);
    if (subtypeAllowed) this.pile.setSubtypeAllowed(subtypeAllowed);
    if (maxCards > 0) this.pile.setMaxCards(maxCards);

    // Create a container for this slot
    this.parentContainer = parentContainer;
    this.container = new PIXI.Container();

    this.container.visible = false;
    this.container.x = x + CARDWIDTH / 2;
    this.container.y = y + CARDHEIGHT / 2;
    if (this.rotate) {
      this.container.rotation = Math.PI / 2;
      this.container.x += BASEUNIT * 2;
      this.container.y -= BASEUNIT * 2;
    }

    this.parentContainer.addChild(this.container);
    this.initStatusText();

    if (this.outlineShow) {
      this.outline = new PIXI.Graphics()
        .roundRect(-2, -2, this.width + 4, this.height + 4, BASEUNIT)
        .fill(0x010101)
        .stroke({ width: 2, color: 0xffffff });
      this.outline.x = -CARDWIDTH / 2;
      this.outline.y = -CARDHEIGHT / 2;
      this.outline.alpha = 0.1;

      if (selectables.includes(this.id)) {
        this.outline.eventMode = 'static';
        this.outline.cursor = 'pointer';
        this.outline.on('pointerdown', () => {
          if (this.expectsSelection) {
            this.table.unselectSlots(this);
            this.toggleSelected();
          }
        });
      }

      this.container.addChild(this.outline);
    }

    this.cardRenderer = new CardRenderer({
      container: this.container,
      textures,
      app: this.app,
    });
  }

  async render() {
    this.maxCardsInPile = Math.max(this.maxCardsInPile ?? 0, this.pile.cards.length);
    let index = 0;
    const cardSpacing = Math.min(CARDWIDTH + BASEUNIT, (this.width - CARDWIDTH) / Math.max(1, this.maxCardsInPile - 1));

    for (const card of this.pile.cards) {
      const cardOffset = this.getCardPosition(index, cardSpacing);

      await this.cardRenderer.render(card, cardOffset, this.snaking ? (Math.sin(index) * BASEUNIT) / 2 : 0);

      this.container.setChildIndex(card.container ?? card.backContainer, index);
      index++;
    }
    this.renderSum();
  }

  getCardPosition(index, cardSpacing) {
    const cardsAmount = ['I', 'X', 'C'].includes(this.id) ? 5 : this.pile.cards.length;
    if (this.layout === 'evenodd') {
      const relativeWidth = ['combat'].includes(this.id) ? this.width : Math.min(this.width, cardsAmount * CARDWIDTH * 0.7);
      const underWideOffset = Math.floor((this.width - relativeWidth) / 2);
      const spacing = Math.floor((relativeWidth - CARDWIDTH / 1.5) / cardsAmount);

      if (index % 2 === 0) {
        return underWideOffset + spacing * (index / 2) - Math.floor(BASEUNIT / 2);
      } else {
        return underWideOffset + relativeWidth - CARDWIDTH - spacing * ((index - 1) / 2) + Math.floor(BASEUNIT / 2);
      }
    }
    const relativeWidth = this.snaking ? this.width : Math.min(this.width, cardsAmount * CARDWIDTH);

    const underWideOffset = Math.floor((this.width - relativeWidth) / 2);

    return underWideOffset + Math.floor(this.reverse ? relativeWidth - CARDWIDTH - index * cardSpacing : index * cardSpacing);
  }

  initStatusText() {
    if (!this.statusText) {
      this.statusText = new PIXI.Text({
        text: '',
        style: {
          fontSize: BASEUNIT * 1 * AAA_SCALING,
          fill: 0xffffff,
          stroke: 0x000000,
          fontFamily: FONT_FAMILY,
          fontWeight: 'bold',
        },
      });
      this.statusText.anchor.set(0.5, 0.5); // bottom right
      this.statusText.scale.y = 1 / AAA_SCALING;
      this.statusText.scale.x = 1 / AAA_SCALING;
      if (this.rotate) {
        this.statusText.rotation -= Math.PI / 2;
        //this.container.x += CARDHEIGHT;
        this.statusText.y = -this.width / 2 - BASEUNIT; //this.height;
        this.statusText.x = this.height / 2 + BASEUNIT * 2; //this.height; // - CARDHEIGHT / 2 + BASEUNIT * 2;
      } else {
        this.statusText.x = this.width - CARDHEIGHT / 2 + BASEUNIT * 1.5;
        this.statusText.y = this.height - BASEUNIT * 1.5 - CARDWIDTH / 2;
      }

      this.container.addChild(this.statusText);
    }
  }

  renderSum() {
    if (['wrath', 'combat', 'loot', 'I'].includes(this.id)) {
      // --- Draw pile sum in lower right corner ---
      const sum = this.overrideSum ?? this.pile.getSum();
      this.statusText.text = sum;
      this.statusText.alpha = sum > 0 ? 1 : 0;
    }
  }

  toggleSelected(state = undefined) {
    this.isSelected = state ?? !this.isSelected;
    //if (this.isSelected) this.toggleExpectsSelection(false);
    if (this.outline) {
      setTimeout(() => {
        this.outline.alpha = this.isSelected ? 1 : 0.1;
      }, 100);
    }
  }

  toggleExpectsSelection(state = undefined) {
    this.expectsSelection = state ?? !this.isSelected;

    if (this.expectsSelection) {
      this.oldChildIndex = this.container.parent.getChildIndex(this.container);
      const highestChildIndex = Math.max(...this.container.parent.children.map((c) => this.container.parent.getChildIndex(c)));
      this.container.parent.setChildIndex(this.container, highestChildIndex);
    } else if (this.oldChildIndex) {
      this.container.parent.setChildIndex(this.container, this.oldChildIndex);
    }

    if (this.expectsSelection) {
      this.startAlphaPulse();
    } else {
      this.stopAlphaPulse();
    }
  }

  startAlphaPulse() {
    if (this.alphaAnimation.isAnimating) return;

    this.alphaAnimation.isAnimating = true;
    const anim = () => {
      if (!this.expectsSelection) {
        this.outline.alpha = 0.1; // reset
        this.ticker.remove(anim);
        this.alphaAnimation.isAnimating = false;
        return;
      }

      this.alphaAnimation.counter += this.alphaAnimation.speed;
      if (!this.isSelected) this.outline.alpha = 0.4 + Math.sin(this.alphaAnimation.counter) / 4; // alpha in ~0.17..0.83
    };

    this.ticker.add(anim);
  }

  stopAlphaPulse() {
    this.alphaAnimation.isAnimating = false;
    this.alphaAnimation.counter = 0;
    this.outline.alpha = 0.5;
  }
}

export { Slot };
