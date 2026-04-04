import { Card } from '~/src/components/card';
import { CardFactory } from './card-factory';
import { feistel } from '~/src/components/rng';
const demoGraphics = false;

const rngTracking = {};

function rollRng(category, offset = 10, range = 20) {
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
  baseValue = 1;
  layout = 'loot';

  /**
   * Creates one or more Marauder Peasant cards.
   *
   * @param {Object} [config={}]
   * @param {number} [config.lootSize=1] - Value multiplier.
   * @returns {Card} generated card.
   */
  create(config = { lootSize: 1, type: 'fate' }) {
    const { lootSize, baseValue, type, faceUp } = config;
    const value = (lootSize || 1) * (baseValue || this.baseValue);
    const id = [this.identity, value].filter(Boolean).join('-');

    const cardType = type ?? this.type ?? 'stamina';
    const replenish = {
      type: cardType === 'stamina' ? 'fate' : 'stamina',
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
  baseValue = 4;
}

class FoodLarge extends FoodSmall {
  identity = 'food-large';
  graphicId = 'food-large';
  baseValue = 7;
}

class FoodExtraLarge extends FoodSmall {
  identity = 'food-extralarge';
  graphicId = 'food-extralarge';
  baseValue = 7;
}

class HealthSmall extends FoodSmall {
  identity = 'health-small';
  graphicId = 'health-small';
  baseValue = 1;
  type = 'fate';
}

class HealthMedium extends FoodSmall {
  identity = 'health-medium';
  graphicId = 'health-medium';
  baseValue = 4;
  type = 'fate';
}

class HealthLarge extends FoodSmall {
  identity = 'health-large';
  graphicId = 'health-large';
  baseValue = 7;
  type = 'fate';
}

class HealthExtraLarge extends FoodSmall {
  identity = 'health-xl';
  graphicId = 'health-extralarge';
  baseValue = 11;
  type = 'fate';
}

export { FoodSmall, FoodMedium, FoodLarge, FoodExtraLarge, HealthSmall, HealthMedium, HealthLarge, HealthExtraLarge };
