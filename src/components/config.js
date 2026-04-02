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

const game = {
  decks: {
    fate: [
      //{ cardType: MarauderPeasant, count: 40 }, // 40%
      { cardType: MarauderGuard, count: 30 }, // 30%
      { cardType: MarauderRoyalGuard, count: 20 }, // 20%
      { cardType: MarauderPrincess, count: 10 }, // 10%
      // { cardType: LootFateSmall, count: 20 },
      // { cardType: LootFateMedium, count: 10 },
      // { cardType: LootFateBig, count: 10 },
    ],
    stamina: [
      // { cardType: SwordWeak, count: 10, type: 'stamina' },
      // { cardType: SwordMedium, count: 10, type: 'stamina' },
      // { cardType: SwordStrong, count: 10, type: 'stamina' },
      // { cardType: AxeWeak, count: 10, type: 'stamina' },
      // { cardType: AxeMedium, count: 10, type: 'stamina' },
      // { cardType: AxeStrong, count: 10, type: 'stamina' },
      // { cardType: ShieldWeak, count: 10, type: 'stamina' },
      // { cardType: ShieldMedium, count: 10, type: 'stamina' },
      // { cardType: ShieldStrong, count: 10, type: 'stamina' },
      // { cardType: ArmorWeak, count: 10, type: 'stamina' },
      // { cardType: ArmorMedium, count: 10, type: 'stamina' },
      // { cardType: ArmorStrong, count: 10, type: 'stamina' },
      // { cardType: HelmetWeak, count: 10, type: 'stamina' },
      // { cardType: HelmetMedium, count: 10, type: 'stamina' },
      // { cardType: HelmetStrong, count: 10, type: 'stamina' },
      { cardType: LootSmall, count: 10, type: 'stamina' },
      { cardType: LootBig, count: 10, type: 'stamina' },
      { cardType: LootMedium, count: 10, type: 'stamina' },
    ],
    wrath: [],
    playerStamina: [],
    playerFate: [],
    combat: [],
    loot: [
      // { cardType: LootSmall, count: 3, faceUp: true },
      // { cardType: LootMedium, count: 3, faceUp: true },
      // { cardType: LootBig, count: 3, faceUp: true },
    ],
    leftGear: [
      // { cardType: SwordWeak, count: 1, type: 'stamina', faceUp: true },
      // { cardType: AxeStrong, count: 1, type: 'stamina', faceUp: true },
    ],
    centerGear: [
      // { cardType: HelmetMedium, count: 1, type: 'stamina', faceUp: true },
      // { cardType: ArmorStrong, count: 1, type: 'stamina', faceUp: true },
    ],
    rightGear: [
      // { cardType: AxeMedium, count: 1, type: 'stamina', faceUp: true },
      // { cardType: SwordStrong, count: 1, type: 'stamina', faceUp: true },
    ],
    discardStamina: [],
    discardFate: [],
  },
  deal: [
    { from: 'fate', to: 'playerFate', count: 10 },
    { from: 'stamina', to: 'playerStamina', count: 10 },
  ],
};

const resolution = 4;

const WIDTH = 420 * resolution;
const HEIGHT = 240 * resolution;
const BASEUNIT = Math.floor(HEIGHT / 40);
const CARDWIDTH = BASEUNIT * 8;
const CARDHEIGHT = BASEUNIT * 12;

export { game, WIDTH, HEIGHT, BASEUNIT, CARDWIDTH, CARDHEIGHT };
