import * as PIXI from 'pixi.js';
import * as textures from 'url:/static/noai/*.png';

import { game } from '~/src/components/config';
import { House } from '~/src/components/house';
import { Table } from '~/src/components/table';
import { ManualMaker } from '~/src/components/manual-maker';
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
  const manual = new ManualMaker({ textures });
  manual.render();
  // drawGrid(app, width, height, BASEUNIT, 0x999999);
  // drawGrid(app, width, height, BASEUNIT * 2, 0xffffff);

  const house = new House();

  house.buildDecks(game);
  const table = new Table({ app, textures, house });
  table.constructTable();

  table.render();
}

main();
