import { WIDTH, HEIGHT, AAA_SCALING as AAA_SCALING_original, BASEUNIT, FONT_FAMILY, VICTORY_GEMS } from './config';
import * as PIXI from 'pixi.js';

const AAA_SCALING = AAA_SCALING_original / 4;
/**
 * Info screen controller for Pixi (start / ending screens).
 * Owns a container and manages its content + visibility.
 */
class InfoScreen {
  ticker = PIXI.Ticker.shared;
  isFading = false;

  /**
   * @param {Object} options
   * @param {boolean} [options.visible=false]
   * @param {string} [options.state='start']
   */
  constructor({ visible = false, state = 'start', textures, app, clickHandler = () => {} } = {}) {
    this.visible = visible;
    this.state = state;
    this.textures = textures;

    this.container = new PIXI.Container();

    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.on('pointerdown', clickHandler);

    app.stage.addChild(this.container);

    this.container.width = WIDTH;
    this.container.height = HEIGHT;
    this.container.x = 0;
    this.container.y = 0;

    this.sprite = new PIXI.Sprite();
    this.sprite.anchor.set(0.5);
    this.sprite.x = WIDTH / 2;
    this.sprite.y = HEIGHT / 2;

    this.heading = new PIXI.Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontSize: BASEUNIT * AAA_SCALING,
        align: 'center',
        fontWeigh: 'bold',
        fontFamily: FONT_FAMILY,
        stroke: {
          width: (BASEUNIT / 8) * AAA_SCALING,
          color: 0x000000,
          alignment: 0,
        },
      },
      layout: {
        width: WIDTH,
        height: HEIGHT,
      },
    });
    this.heading.anchor.set(0.5);
    this.heading.x = WIDTH / 2;
    this.heading.y = HEIGHT / 2 - BASEUNIT * 3;
    this.heading.wordWrapWidth = WIDTH;

    this.heading.scale.y = 3 / AAA_SCALING;
    this.heading.scale.x = 3 / AAA_SCALING;

    const paragraphScaling = 4;
    const paragraphRatio = 3 / 4;
    const paragraphWidth = (WIDTH * paragraphRatio * AAA_SCALING) / paragraphScaling; // (paragraphWidth * AAA_SCALING) / paragraphScaling

    this.text = new PIXI.Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontSize: ((BASEUNIT * AAA_SCALING) / paragraphScaling) * 2,
        align: 'center',
        fontWeigh: 'bold',
        fontFamily: FONT_FAMILY,
        wordWrap: true,
        wordWrapWidth: paragraphWidth,
        stroke: {
          width: ((BASEUNIT / 3) * AAA_SCALING) / paragraphScaling,
          color: 0x000000,
          alignment: 0,
        },
      },
    });

    const x = Math.floor((WIDTH * (1 - paragraphRatio)) / 2);
    this.text.x = x;
    this.text.y = HEIGHT / 2;
    this.text.scale.set(paragraphScaling / AAA_SCALING);

    this.container.addChild(this.sprite, this.heading, this.text);

    this.render();
  }

  /**
   * Set current screen state
   * @param {string} state
   */
  setState({ state, data }) {
    this.state = state;
    this.stateData = data;
    this.render();
  }

  /**
   * Sync container visibility
   */
  updateVisibility(visibility = this.visible) {
    if (this.isFading) return;

    this.visible = visibility;

    const speed = 0.04;
    const target = this.visible ? 1 : 0;

    if (this.visible) {
      this.container.visible = true;
      this.container.alpha = 0;
    }

    const step = () => {
      const diff = target - this.container.alpha;
      this.container.alpha += diff * speed;

      if (Math.abs(diff) < 0.01) {
        this.container.alpha = target;

        if (target === 0) {
          this.container.visible = false;
        }

        this.ticker.remove(step);
        this.isFading = false;
        return;
      }
    };

    this.isFading = true;
    this.ticker.add(step);
  }

  /**
   * Returns content for current state
   */
  getContent() {
    const screens = {
      start: {
        texture: this.textures['game-start'],
        heading: 'Welcome, warrior',
        text: `The marauders have stolen ${VICTORY_GEMS} precious Luxurium gems. Your mission: enter their lair, fight the enemies, and recover them all. Every step is a challenge. Let no monster stand in your way.\n\nClick to start ◇ Scroll for manual`,
      },
      victory: {
        texture: this.textures['game-end-victory'],
        heading: 'Triumph!',
        text: 'You recovered %gems% Luxurium gems. Your village will celebrate your bravery, and the tales of your deeds will echo through the halls for generations.',
      },
      exhausted: {
        texture: this.textures['game-end-exhausted'],
        heading: 'Exhausted!',
        text: 'You tried your best, but your Stamina has run out. You barely made it out of the lair, bruised and weary, yet wiser for the experience. Rest, prepare, and return stronger.',
      },
      defeated: {
        texture: this.textures['game-end-beaten'],
        heading: 'Defeated!',
        text: 'You fought bravely, but the last enemy was too strong. Overcome and unconscious, you were dragged from the lair. Recover, warrior—your quest is not yet finished.',
      },
    };

    return screens[this.state] || screens.start;
  }

  /**
   * Apply current state to visuals
   */
  async render() {
    let { texture, text, heading } = this.getContent();

    if (this.stateData) {
      Object.entries(this.stateData).forEach(([key, value]) => {
        text = text.replace(`%${key}%`, value);
      });
    }

    this.sprite.texture = await PIXI.Assets.load(texture);
    this.heading.text = heading;
    this.text.text = text;

    const tex = this.sprite.texture.orig;
    const containerRatio = WIDTH / HEIGHT;
    const texRatio = tex.width / tex.height;

    const scale = texRatio > containerRatio ? HEIGHT / tex.height : WIDTH / tex.width;

    this.sprite.width = tex.width * scale;
    this.sprite.height = tex.height * scale;

    this.sprite.x = WIDTH / 2;
    this.sprite.y = HEIGHT / 2;
  }
}

export { InfoScreen };
