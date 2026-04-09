import * as PIXI from 'pixi.js';
import { textures } from '~/src/components/textures';
import { textures as noAiTextures } from '~/src/components/textures-noai';

const texturePackObject = process.env.NOAI ? noAiTextures : textures;

import { game } from '~/src/components/config';
import { House } from '~/src/components/house';
import { Table } from '~/src/components/table';
import { ManualMaker } from '~/src/components/manual-maker';
import { BASEUNIT, WIDTH, HEIGHT } from './components/config';

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

function requestFullscreen(element) {
  // Standard method (modern browsers)
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  }
  // Firefox (legacy)
  else if (element.mozRequestFullScreen) {
    return element.mozRequestFullScreen();
  }
  // Chrome, Safari, Opera (legacy)
  else if (element.webkitRequestFullscreen) {
    return element.webkitRequestFullscreen();
  }
  // IE11 and Edge Legacy
  else if (element.msRequestFullscreen) {
    return element.msRequestFullscreen();
  }
  // Unsupported browser
  else {
    console.error('Fullscreen API not supported in this browser.');
    return Promise.reject(new Error('Unsupported browser'));
  }
}

function exitFullscreen() {
  // Standard method
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  }
  // Firefox (legacy)
  else if (document.mozCancelFullScreen) {
    return document.mozCancelFullScreen();
  }
  // Chrome, Safari, Opera (legacy)
  else if (document.webkitExitFullscreen) {
    return document.webkitExitFullscreen();
  }
  // IE11 and Edge Legacy
  else if (document.msExitFullscreen) {
    return document.msExitFullscreen();
  }
  // Unsupported browser
  else {
    console.error('Exit fullscreen not supported.');
    return Promise.reject(new Error('Unsupported browser'));
  }
}

async function main() {
  const app = new PIXI.Application();

  await app.init({
    width: width,
    height: height,
    backgroundColor: 0x000000,
    antialias: false,
  });

  // Preload all the graphics
  PIXI.Assets.addBundle('texturePack', texturePackObject);
  const texturePack = await PIXI.Assets.loadBundle('texturePack');
  document.querySelector('#loading').classList.add('hidden');

  document.body.appendChild(app.canvas);
  const manual = new ManualMaker({ textures: texturePackObject });
  manual.render();
  // drawGrid(app, width, height, BASEUNIT, 0x999999);
  // drawGrid(app, width, height, BASEUNIT * 2, 0xffffff);

  const house = new House();

  house.buildDecks(game);
  const table = new Table({ app, textures: texturePack, house });
  table.constructTable();

  table.render();

  const fullscreenButton = new PIXI.Text({
    text: '⛶',
    style: {
      fontSize: BASEUNIT * 2,
      fill: 0x999999,
    },
  });

  fullscreenButton.x = WIDTH - BASEUNIT * 2;
  fullscreenButton.y = HEIGHT - BASEUNIT * 2.5;
  fullscreenButton.eventMode = 'static';
  fullscreenButton.cursor = 'pointer';

  let isFullscreen = false;

  fullscreenButton.on('pointertap', async () => {
    try {
      if (isFullscreen) {
        await exitFullscreen();
      } else {
        await requestFullscreen(document.documentElement);
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
    isFullscreen = !isFullscreen;
    fullscreenButton.text = isFullscreen ? '↙' : '⛶';
  });

  app.stage.addChild(fullscreenButton);
}

main();
