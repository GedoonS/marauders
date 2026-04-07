import { Card } from '~/src/components/card';
import { CardFactory } from './card-factory';
import { feistel } from '~/src/components/rng';

const rngTracking = {};

function rollRng(category, offset = 10, range = 20) {
  const nextRnd = feistel(rngTracking[category] || Object.keys(rngTracking).length);
  rngTracking[category] = nextRnd;
  return offset + (nextRnd % range);
}

/**
 * Factory for generating Loot cards.
 */
class GenericWeapon extends CardFactory {
  identity = 'sword-weak';
  graphicId = 'sword-weak';
  baseValue = 2;
  combatType = 'add';
  layout = 'weapon';
  subtype = 'hand';

  /**
   * Creates one or more Marauder Peasant cards.
   *
   * @param {Object} [config={}]
   * @returns {Card} generated card.
   */
  create(config = { type: 'stamina' }) {
    const { type, faceUp } = config;
    const value = rollRng(this.identity);
    const combat = {
      [this.combatType]: this.baseValue,
      subtype: this.subtype,
    };

    const id = [this.identity, value].filter(Boolean).join('-');

    return new Card({
      id,
      type: type ?? 'stamina',
      spirit: value,
      graphicId: this.graphicId,
      faceUp,
      combat,
      layout: this.layout,
      isWeapon: true,
    });
  }
}

class SwordWeak extends GenericWeapon {
  identity = 'sword-weak';
  graphicId = 'sword-weak';
  baseValue = 2 * 5;
  //combatType = 'mult';
  subtype = 'hand';
}

class SwordMedium extends GenericWeapon {
  identity = 'sword-medium';
  graphicId = 'sword-medium';
  baseValue = 2;
  combatType = 'mult';
  subtype = 'hand';
}

class SwordStrong extends GenericWeapon {
  identity = 'sword-strong';
  graphicId = 'sword-strong';
  baseValue = 3;
  combatType = 'mult';
  subtype = 'hand';
}

class AxeWeak extends GenericWeapon {
  identity = 'axe-weak';
  graphicId = 'axe-weak';
  baseValue = 2 * 5;
  subtype = 'hand';
}

class AxeMedium extends GenericWeapon {
  identity = 'axe-medium';
  graphicId = 'axe-medium';
  baseValue = 3 * 5;
  subtype = 'hand';
}

class AxeStrong extends GenericWeapon {
  identity = 'axe-strong';
  graphicId = 'axe-strong';
  baseValue = 5 * 5;
  subtype = 'hand';
}

class ShieldWeak extends GenericWeapon {
  identity = 'shield-weak';
  graphicId = 'shield-weak';
  baseValue = 3;
  subtype = 'hand';
  combatType = 'sub';
}

class ShieldMedium extends GenericWeapon {
  identity = 'shield-medium';
  graphicId = 'shield-medium';
  baseValue = 5;
  subtype = 'hand';
  combatType = 'sub';
}

class ShieldStrong extends GenericWeapon {
  identity = 'shield-strong';
  graphicId = 'shield-strong';
  baseValue = 10;
  subtype = 'hand';
  combatType = 'sub';
}

class ArmorWeak extends GenericWeapon {
  identity = 'armor-weak';
  graphicId = 'armor-weak';
  baseValue = 1 * 5;
  subtype = 'armor';
  combatType = 'sub';
}

class ArmorMedium extends GenericWeapon {
  identity = 'armor-medium';
  graphicId = 'armor-medium';
  baseValue = 2 * 5;
  subtype = 'armor';
  combatType = 'sub';
}

class ArmorStrong extends GenericWeapon {
  identity = 'armor-strong';
  graphicId = 'armor-strong';
  baseValue = 3 * 5;
  subtype = 'armor';
  combatType = 'sub';
}

class HelmetWeak extends GenericWeapon {
  identity = 'helmet-weak';
  graphicId = 'helmet-weak';
  baseValue = 2 * 10;
  subtype = 'helmet';
  combatType = 'sub';
}

class HelmetMedium extends GenericWeapon {
  identity = 'helmet-medium';
  graphicId = 'helmet-medium';
  baseValue = 2;
  subtype = 'helmet';
  combatType = 'div';
}

class HelmetStrong extends GenericWeapon {
  identity = 'helmet-strong';
  graphicId = 'helmet-strong';
  baseValue = 3;
  subtype = 'helmet';
  combatType = 'div';
}

export {
  SwordWeak,
  SwordMedium,
  SwordStrong,
  AxeWeak,
  AxeMedium,
  AxeStrong,
  ShieldWeak,
  ShieldMedium,
  ShieldStrong,
  ArmorWeak,
  ArmorMedium,
  ArmorStrong,
  HelmetWeak,
  HelmetMedium,
  HelmetStrong,
};
