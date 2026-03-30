import { MarauderPeasant, MarauderGuard, MarauderRoyalGuard, MarauderPrincess } from '~/src/components/cards/marauders';

const game = {
  decks: {
    fate: [
      { cardType: MarauderPeasant, count: 40 }, // 40%
      { cardType: MarauderGuard, count: 30 }, // 30%
      { cardType: MarauderRoyalGuard, count: 20 }, // 20%
      { cardType: MarauderPrincess, count: 10 }, // 10%
      // { cardType: LootSmall, cardCount: 20 },
    ],
    // stamina: [
    //   { cardType: Spirit6, cardCount: 10 }
    // ]
    wrath: [],
    playerStamina: [],
    playerFate: [],
    combat: [],
    loot: [],
    leftGear: [],
    centerGear: [],
    rightGear: [],
  },
  deal: {
    fate: 20,
    stamina: 20,
  },
};

const WIDTH = 420;
const HEIGHT = 240;
const BASEUNIT = Math.floor(HEIGHT / 40);
const CARDWIDTH = BASEUNIT * 8;
const CARDHEIGHT = BASEUNIT * 12;

export { game, WIDTH, HEIGHT, BASEUNIT, CARDWIDTH, CARDHEIGHT };
