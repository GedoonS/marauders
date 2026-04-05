import { Card } from '~/src/components/card';
import { CardFactory } from './card-factory';
const demoGraphics = false;
/**
 * Factory for generating Marauder cards.
 */
class MarauderPeasant extends CardFactory {
  identity = 'marauder-peasant';
  graphicId = demoGraphics ? 'threeoclubs' : 'peasant';
  baseSpirit = 30;
  layout = 'enemy';
  /**
   * Creates one or more Marauder Peasant cards.
   *
   * @param {Object} [config={}]
   * @param {number} [config.enemyGroupSize=1] - Number of enemies to generate in this group.
   * @returns {Card} generated card.
   */
  create(config = { enemyGroupSize: 1 }) {
    const { enemyGroupSize, baseSpirit, faceUp } = config;
    const spirit = (enemyGroupSize || 1) * (baseSpirit || this.baseSpirit);

    const wrath = Math.floor(spirit / 10);

    const id = [this.identity, enemyGroupSize, baseSpirit].filter(Boolean).join('-');

    return new Card({
      id,
      type: 'fate',
      spirit,
      wrath,
      graphicId: this.graphicId,
      faceUp,
      layout: this.layout,
      liveEnemy: true,
      isEnemy: true,
    });
  }
}

class MarauderGuard extends MarauderPeasant {
  identity = 'marauder-guard';
  graphicId = demoGraphics ? 'threeoclubs' : 'guard';
  baseSpirit = 50;
}

class MarauderRoyalGuard extends MarauderPeasant {
  identity = 'marauder-royal-guard';
  graphicId = demoGraphics ? 'threeoclubs' : 'royal-guard';
  baseSpirit = 80;
}

class MarauderPrincess extends MarauderPeasant {
  identity = 'marauder-princess';
  graphicId = demoGraphics ? 'threeoclubs' : 'princess';
  baseSpirit = 90;
}

export { MarauderPeasant, MarauderGuard, MarauderRoyalGuard, MarauderPrincess };
