import * as PIXI from 'pixi.js';
import { textures } from '~/src/components/textures';
import { textures as noAiTextures } from '~/src/components/textures-noai';

const texturePackObject = process.env.NOAI ? noAiTextures : textures;

import { game } from '~/src/components/config';
import { House } from '~/src/components/house';
import { Table } from '~/src/components/table';
import { ManualMaker } from '~/src/components/manual-maker';
import { BASEUNIT, WIDTH, HEIGHT } from './components/config';
import { makeFullScreenButton, makeRefreshButton } from './components/helpers';

const width = WIDTH;
const height = HEIGHT;

async function main() {
  // Preload all the graphics
  PIXI.Assets.addBundle('texturePack', texturePackObject);
  const texturePack = await PIXI.Assets.loadBundle('texturePack');
  document.querySelector('#loading').classList.add('hidden');

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
  const table = new Table({ app, textures: texturePack, house });
  table.constructTable();

  table.render();

  makeFullScreenButton(app);
  makeRefreshButton(app);

  const manual = new ManualMaker({ textures: texturePackObject });
  manual.render();
}

main();
