import * as PIXI from 'pixi.js';
import * as textures from 'url:/static/*.png';
import { MarauderPeasant } from '~/src/components/cards/marauders';

import { game } from '~/src/components/config';
import { House } from '~/src/components/house';
import { Table } from '~/src/components/table';

const width = 420;
const height = 240;

async function main() {
  const app = new PIXI.Application();

  await app.init({
    width: width,
    height: height,
    backgroundColor: 0x000000,
    antialias: false,
  });

  document.body.appendChild(app.canvas);

  const house = new House();

  house.buildDecks(game);
  const table = new Table({ app, textures });

  // hand slot: width * 0.8
  const handWidth = width * 0.8;
  const handHeight = height * 0.8;
  const handX = (width - handWidth) / 2;
  const handY = (height - handHeight) / 2;

  table.addSlot({
    id: 'hand',
    x: handX,
    y: handY,
    width: handWidth,
    height: handHeight,
    layout: 'fan',
    pile: house.piles.hand,
  });

  // Game loop
  let elapsed = 0;
  let dealt = 0;
  const maxCards = 10;
  const delay = 1000; // ms

  app.ticker.add((ticker) => {
    if (dealt >= maxCards) return;

    elapsed += ticker.deltaMS;

    if (elapsed >= delay) {
      elapsed = 0;

      house.deal('fate', 'hand', 1);
      table.render();

      dealt++;
    }
  });
}

main();
