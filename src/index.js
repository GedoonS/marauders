import * as PIXI from 'pixi.js';
import * as textures from 'url:/static/*.png';

import { game } from '~/src/components/config';
import { House } from '~/src/components/house';
import { Table } from '~/src/components/table';
import { CARDHEIGHT, CARDWIDTH, BASEUNIT, WIDTH, HEIGHT } from './components/config';

const width = WIDTH;
const height = HEIGHT;

function drawGrid(app, width, height, unit = BASEUNIT, color = 0xffffff) {
  const grid = new PIXI.Graphics();

  grid.setStrokeStyle({ width: 1, color, alpha: 0.2 });

  // Horizontal lines
  for (let y = unit - 1; y <= height; y += unit) {
    grid.moveTo(0, y);
    grid.lineTo(width, y);
  }

  // Vertical lines
  for (let x = unit; x <= width; x += unit) {
    grid.moveTo(x, 0);
    grid.lineTo(x, height);
  }

  grid.stroke();

  app.stage.addChild(grid);
}

async function main() {
  const app = new PIXI.Application();

  await app.init({
    width: width,
    height: height,
    backgroundColor: 0x000000,
    antialias: false,
  });

  document.body.appendChild(app.canvas);

  // drawGrid(app, width, height, BASEUNIT, 0x999999);
  // drawGrid(app, width, height, BASEUNIT * 2, 0xffffff);

  const house = new House();

  house.buildDecks(game);
  const table = new Table({ app, textures, house });
  table.constructTable();

  // Game loop
  let elapsed = 0;
  let dealt = 0;
  const maxCards = 16;
  const delay = 400; // ms

  // house.deal('fate', 'playerFate', 20, false);
  // house.deal('stamina', 'playerStamina', 20, false);
  table.render();

  // app.ticker.add((ticker) => {
  //   if (dealt >= maxCards) return;

  //   elapsed += ticker.deltaMS;

  //   if (elapsed >= delay) {
  //     elapsed = 0;

  //     house.deal('fate', 'playerFate', 1, false);
  //     house.deal('stamina', 'playerStamina', 1, false);

  //     if (dealt < maxCards / 3) {
  //       house.deal('fate', 'wrath', 1, true);
  //       house.deal('stamina', 'combat', 1, true);
  //     }

  //     // if (dealt < maxCards / 2) {
  //     //   house.deal('fate', 'loot', 1, true);
  //     // }
  //     // if (dealt < 2) {
  //     //   house.deal('stamina', 'leftGear', 1, true);
  //     //   house.deal('stamina', 'centerGear', 1, true);
  //     //   house.deal('stamina', 'rightGear', 1, true);
  //     // }

  //     table.render();

  //     dealt++;
  //   }
  // });
}

main();
