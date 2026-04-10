import * as PIXI from 'pixi.js';
import { BASEUNIT, HEIGHT, WIDTH } from './config';

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

function iOS() {
  return (
    [
      // iDevices
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod',
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  );
}

const buttonAlpha = 0.25;
const buttonBg = 0xaaffff;

const makeFullScreenButton = (app) => {
  if (iOS()) return;

  const fullscreenButton = new PIXI.Text({
    text: '⛶',
    style: {
      fontSize: BASEUNIT * 4,
      fill: 0x000000,
    },
  });

  fullscreenButton.x = WIDTH - BASEUNIT * 4.5;
  fullscreenButton.y = HEIGHT - BASEUNIT * 2;
  fullscreenButton.eventMode = 'static';
  fullscreenButton.cursor = 'pointer';
  fullscreenButton.anchor.set(0.5, 0.5);

  fullscreenButton.scale.set(0.5);

  let isFullscreen = false;

  const updateButton = () => {
    isFullscreen = !!document.fullscreenElement;
    fullscreenButton.text = isFullscreen ? '◱' : '⛶';
  };

  fullscreenButton.on('pointertap', async () => {
    try {
      isFullscreen ? await exitFullscreen() : await requestFullscreen(document.documentElement);
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
    updateButton();
  });

  document.addEventListener('fullscreenchange', updateButton);

  const bg = new PIXI.Graphics().roundRect(fullscreenButton.x, fullscreenButton.y, BASEUNIT * 2, BASEUNIT * 2, BASEUNIT / 2).fill(buttonBg);
  bg.pivot.set(BASEUNIT, BASEUNIT);
  bg.alpha = buttonAlpha;

  app.stage.addChild(bg);
  app.stage.addChild(fullscreenButton);
};

const makeRefreshButton = (app) => {
  const refreshButton = new PIXI.Text({
    text: '╳', //'\u00D7',
    style: {
      fontSize: BASEUNIT * 5,
      fill: 0x000000,
    },
  });

  const yCorrection = iOS() ? 0 : 0.3 * BASEUNIT;

  refreshButton.x = WIDTH - BASEUNIT * 2;
  refreshButton.y = HEIGHT - BASEUNIT * 2 - yCorrection;
  refreshButton.eventMode = 'static';
  refreshButton.cursor = 'pointer';
  refreshButton.scale.set(0.5);
  refreshButton.anchor.set(0.5, 0.5);
  refreshButton.on('pointertap', async () => {
    window.location.reload();
  });

  const bg = new PIXI.Graphics()
    .roundRect(refreshButton.x, refreshButton.y + yCorrection, BASEUNIT * 2, BASEUNIT * 2, BASEUNIT / 2)
    .fill(buttonBg);
  bg.pivot.set(BASEUNIT, BASEUNIT);
  bg.alpha = buttonAlpha;

  app.stage.addChild(bg);
  app.stage.addChild(refreshButton);
};

export { drawGrid, makeFullScreenButton, makeRefreshButton };
