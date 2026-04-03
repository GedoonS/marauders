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
 * Factory for generating Loot cards.
 */
class LootSmall extends CardFactory {
  identity = 'loot-small';
  graphicId = demoGraphics ? 'threeoclubs' : 'luxurium-small';
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

    const spirit = rollRng(this.identity) + value;
    return new Card({
      id,
      type: type ?? 'fate',
      lootValue: value,
      spirit: this.noSpirit ? 0 : spirit,
      graphicId: this.graphicId,
      faceUp,
      layout: this.layout,
      isLoot: true,
    });
  }
}

class LootMedium extends LootSmall {
  identity = 'loot-big';
  graphicId = demoGraphics ? 'threeoclubs' : 'luxurium-medium';
  baseValue = 4;
}

class LootBig extends LootSmall {
  identity = 'loot-big';
  graphicId = demoGraphics ? 'threeoclubs' : 'luxurium-big';
  baseValue = 7;
}

class LootFateSmall extends LootSmall {
  noSpirit = true;
  identity = 'loot-big';
  graphicId = demoGraphics ? 'threeoclubs' : 'luxurium-fate-medium';
  baseValue = 5;
  layout = 'lootFate';
}

class LootFateMedium extends LootSmall {
  noSpirit = true;
  identity = 'loot-big';
  graphicId = demoGraphics ? 'threeoclubs' : 'luxurium-fate-medium';
  baseValue = 8;
  layout = 'lootFate';
}

class LootFateBig extends LootSmall {
  noSpirit = true;
  identity = 'loot-big';
  graphicId = demoGraphics ? 'threeoclubs' : 'luxurium-fate-big';
  baseValue = 13;
  layout = 'lootFate';
}

export { LootSmall, LootMedium, LootBig, LootFateSmall, LootFateMedium, LootFateBig };
