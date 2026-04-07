import Mustache from 'mustache';
import manual from '/static/manual.json';

import * as config from './config';

const template = `
  <div class="manual">
    {{#entries}}
      <section class="manual-block">
        <div class="manual-content">
          <div class="manual-text">
            <h2>{{title}}</h2>
            {{#bodyText}}<p>{{text}}</p>{{/bodyText}}
          </div>
          <div class="manual-image {{#class}}{{class}}{{/class}}">
            <img src="{{imageUrl}}" />
          </div>
        </div>
      </section>
    {{/entries}}
  </div>
`;

class ManualMaker {
  constructor({ textures, container = document.body }) {
    this.data = manual;
    this.textures = textures;
    this.container = container;
  }

  render() {
    const view = {
      entries: this.data.map((block) => ({
        ...block,
        bodyText: block.text.split('\n\n').map((text) => ({ text: this.#textReplace(text) })),
        imageUrl: this.#resolveImage(block.image),
      })),
    };

    const html = Mustache.render(template, view);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    this.container.appendChild(wrapper.firstElementChild);
  }

  #textReplace(text) {
    Object.entries(config).forEach(([key, value]) => {
      text = text.replace(`%${key}%`, value);
    });
    return text;
  }

  #resolveImage(key) {
    return this.textures[key] || '';
  }
}

export { ManualMaker };
