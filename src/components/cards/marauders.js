import { Card } from '~/src/components/card';
import { CardFactory } from './card-factory';

/**
 * Factory for generating Marauder Peasant cards.
 * Supports creating single enemies or groups via `enemyGroupSize`.
 */
class MarauderPeasant extends CardFactory {
  identity = 'marauder-peasant';
  graphicId = 'peasant';
  baseSpirit = 10;
  /**
   * Creates one or more Marauder Peasant cards.
   *
   * @param {Object} [config={}]
   * @param {number} [config.enemyGroupSize=1] - Number of enemies to generate in this group.
   * @returns {Card} generated card.
   */
  create(config = { enemyGroupSize: 1 }) {
    const { enemyGroupSize, baseSpirit } = config;
    const spirit = enemyGroupSize * (baseSpirit || this.baseSpirit);

    const wrath = Math.floor(spirit / 10);

    const id = [this.identity, enemyGroupSize, baseSpirit]
      .filter(Boolean)
      .join('-');

    return new Card({
      id,
      type: 'fate',
      spirit,
      wrath,
      graphicId: this.graphicId,
    });
  }
}

class MarauderGuard extends MarauderPeasant {
  identity = 'marauder-guard';
  graphicId = 'guard';
  baseSpirit = 40;
}

class MarauderRoyalGuard extends MarauderPeasant {
  identity = 'marauder-royal-guard';
  graphicId = 'royal-guard';
  baseSpirit = 70;
}

class MarauderPrincess extends MarauderPeasant {
  identity = 'marauder-princess';
  graphicId = 'princess';
  baseSpirit = 100;
}

export { MarauderPeasant, MarauderGuard, MarauderRoyalGuard, MarauderPrincess };
