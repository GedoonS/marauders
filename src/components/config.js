import { MarauderPeasant, MarauderGuard, MarauderRoyalGuard, MarauderPrincess } from '~/src/components/cards/marauders';
import { LootBig, LootSmall, LootMedium, LootFateSmall, LootFateMedium, LootFateBig } from '~/src/components/cards/loot';
import {
  AxeMedium,
  AxeStrong,
  AxeWeak,
  ShieldMedium,
  ShieldStrong,
  ShieldWeak,
  SwordMedium,
  SwordStrong,
  SwordWeak,
  ArmorWeak,
  ArmorMedium,
  ArmorStrong,
  HelmetStrong,
  HelmetMedium,
  HelmetWeak,
} from '~/src/components/cards/weapons';
import { FoodExtraLarge, FoodLarge, FoodMedium, FoodSmall } from '~/src/components/cards/replenish';
import { HealthExtraLarge, HealthLarge, HealthMedium, HealthSmall } from '~/src/components/cards/replenish';

// 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144

const game = {
  decks: {
    fate: [
      { cardType: MarauderPeasant, count: 34 },
      { cardType: MarauderGuard, count: 21 },
      { cardType: MarauderRoyalGuard, count: 13 },
      { cardType: MarauderPrincess, count: 8 },

      { cardType: LootFateSmall, count: 13 },
      { cardType: LootFateMedium, count: 8 },
      { cardType: LootFateBig, count: 5 },

      { cardType: HealthSmall, count: 8 },
      { cardType: HealthMedium, count: 5 },
      { cardType: HealthLarge, count: 3 },
      { cardType: HealthExtraLarge, count: 2 },

      { cardType: FoodSmall, count: 8, type: 'fate' },
      { cardType: FoodMedium, count: 5, type: 'fate' },
      { cardType: FoodLarge, count: 3, type: 'fate' },
      { cardType: FoodExtraLarge, count: 2, type: 'fate' },
    ],
    stamina: [
      { cardType: SwordWeak, count: 5, type: 'stamina' },
      { cardType: SwordMedium, count: 3, type: 'stamina' },
      { cardType: SwordStrong, count: 2, type: 'stamina' },

      { cardType: AxeWeak, count: 5, type: 'stamina' },
      { cardType: AxeMedium, count: 3, type: 'stamina' },
      { cardType: AxeStrong, count: 2, type: 'stamina' },

      { cardType: ShieldWeak, count: 5, type: 'stamina' },
      { cardType: ShieldMedium, count: 3, type: 'stamina' },
      { cardType: ShieldStrong, count: 2, type: 'stamina' },

      { cardType: ArmorWeak, count: 5, type: 'stamina' },
      { cardType: ArmorMedium, count: 3, type: 'stamina' },
      { cardType: ArmorStrong, count: 2, type: 'stamina' },

      { cardType: HelmetWeak, count: 5, type: 'stamina' },
      { cardType: HelmetMedium, count: 3, type: 'stamina' },
      { cardType: HelmetStrong, count: 2, type: 'stamina' },

      { cardType: LootSmall, count: 8, type: 'stamina' },
      { cardType: LootBig, count: 5, type: 'stamina' },
      { cardType: LootMedium, count: 2, type: 'stamina' },

      { cardType: FoodSmall, count: 8 },
      { cardType: FoodMedium, count: 5 },
      { cardType: FoodLarge, count: 3 },
      { cardType: FoodExtraLarge, count: 2 },

      { cardType: HealthSmall, count: 13, type: 'stamina' },
      { cardType: HealthMedium, count: 8, type: 'stamina' },
      { cardType: HealthLarge, count: 5, type: 'stamina' },
      { cardType: HealthExtraLarge, count: 3, type: 'stamina' },
    ],
    wrath: [],
    'player-stamina': [],
    'player-fate': [],
    combat: [],
    loot: [
      // { cardType: LootSmall, count: 3, faceUp: true },
      // { cardType: LootMedium, count: 3, faceUp: true },
      // { cardType: LootBig, count: 3, faceUp: true },
    ],
    discardStamina: [],
    discardFate: [],
    I: [],
    C: [],
    X: [],
    Idiscard: [{ cardType: MarauderPeasant, count: 5 }],
    Cdiscard: [{ cardType: MarauderPeasant, count: 5 }],
    Xdiscard: [{ cardType: MarauderPeasant, count: 5 }],
  },
  deal: [
    { from: 'fate', to: 'player-fate', count: 20 },
    { from: 'stamina', to: 'player-stamina', count: 20 },
  ],
};

const PLAYER_PILES = [
  { pile: 'trinketLeft', gearType: 'trinket' },
  { pile: 'trinketRight', gearType: 'trinket' },

  { pile: 'gearLeftHand', gearType: 'hand' },
  { pile: 'gearRightHand', gearType: 'hand' },

  { pile: 'gearHead', gearType: 'helmet' },
  { pile: 'gearBody', gearType: 'armor' },
];

const PILE_TYPE_MAP = Object.fromEntries(PLAYER_PILES.map(({ pile, gearType }) => [pile, gearType]));

PLAYER_PILES.forEach(({ pile }) => {
  game.decks[pile] = [];
});

const resolution = 3;

const WIDTH = 420 * resolution;
const HEIGHT = 240 * resolution;
const BASEUNIT = Math.floor(HEIGHT / 40);
const CARDWIDTH = BASEUNIT * 8;
const CARDHEIGHT = BASEUNIT * 12;
const AAA_SCALING = 100 / resolution;
const FONT_FAMILY = 'verdana';
const VICTORY_GEMS = 137; //100;

export {
  //
  game,
  WIDTH,
  HEIGHT,
  BASEUNIT,
  CARDWIDTH,
  CARDHEIGHT,
  AAA_SCALING,
  FONT_FAMILY,
  PLAYER_PILES,
  PILE_TYPE_MAP,
  VICTORY_GEMS,
};
