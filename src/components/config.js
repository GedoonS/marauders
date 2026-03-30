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
    hand: [],
  },
  deal: {
    fate: 20,
    stamina: 20,
  },
};

export { game };
