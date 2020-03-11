import React, { ReactElement } from 'react';
import { render } from 'react-dom';

export function mount(app: ReactElement): void {
  document.body.innerHTML = '';
  const element = document.createElement('div');
  element.setAttribute('class', 'app');
  document.body.appendChild(element);
  render(app, element);
}

window.addEventListener('load', () => {
  mount(React.createElement('div', null, 'Hello World!'));
});
