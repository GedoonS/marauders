import { Card } from '~/src/components/card';
import { CardFactory } from './card-factory';
import { feistel } from '~/src/components/rng';
const demoGraphics = false;

const rngTracking = {};

function rollRng(category, offset = 10, range = 10) {
  const nextRnd = feistel(rngTracking[category] || Object.keys(rngTracking).length);
  rngTracking[category] = nextRnd;
  return offset + (nextRnd % range);
}

/**
 * Factory for generating Food cards.
 */
class FoodSmall extends CardFactory {
  identity = 'food-small';
  graphicId = 'food-small';
  baseValue = 2;
  layout = 'loot';
  replenishTarget = 'fate';

  /**
   * Creates one or more Marauder Peasant cards.
   *
   * @param {Object} [config={}]
   * @param {number} [config.lootSize=1] - Value multiplier.
   * @returns {Card} generated card.
   */
  create(config = { lootSize: 1, type: 'fate' }) {
    const { lootSize, baseValue, type, faceUp, replenishTarget } = config;
    const value = (lootSize || 1) * (baseValue || this.baseValue);
    const id = [this.identity, value].filter(Boolean).join('-');

    const cardType = type ?? this.type ?? 'stamina';
    const _replenishTarget = replenishTarget ?? this.replenishTarget ?? (cardType === 'stamina' ? 'fate' : 'stamina');
    const replenish = {
      type: _replenishTarget,
      to: `player-${_replenishTarget}`,
      value,
    };

    const spirit = rollRng(this.identity) + value;
    return new Card({
      id,
      type: cardType,
      lootValue: value,
      spirit: this.noSpirit ? 0 : spirit,
      graphicId: this.graphicId,
      faceUp,
      layout: this.layout,
      isReplenish: true,
      replenish,
    });
  }
}

class FoodMedium extends FoodSmall {
  identity = 'food-medium';
  graphicId = 'food-medium';
  baseValue = 3;
  replenishTarget = 'fate';
}

class FoodLarge extends FoodSmall {
  identity = 'food-large';
  graphicId = 'food-large';
  baseValue = 5;
  replenishTarget = 'fate';
}

class FoodExtraLarge extends FoodSmall {
  identity = 'food-extralarge';
  graphicId = 'food-extralarge';
  baseValue = 8;
  replenishTarget = 'fate';
}

class HealthSmall extends FoodSmall {
  identity = 'health-small';
  graphicId = 'health-small';
  baseValue = 2;
  type = 'fate';
  replenishTarget = 'stamina';
}

class HealthMedium extends FoodSmall {
  identity = 'health-medium';
  graphicId = 'health-medium';
  baseValue = 3;
  type = 'fate';
  replenishTarget = 'stamina';
}

class HealthLarge extends FoodSmall {
  identity = 'health-large';
  graphicId = 'health-large';
  baseValue = 5;
  type = 'fate';
  replenishTarget = 'stamina';
}

class HealthExtraLarge extends FoodSmall {
  identity = 'health-xl';
  graphicId = 'health-extralarge';
  baseValue = 8;
  type = 'fate';
  replenishTarget = 'stamina';
}

export { FoodSmall, FoodMedium, FoodLarge, FoodExtraLarge, HealthSmall, HealthMedium, HealthLarge, HealthExtraLarge };
