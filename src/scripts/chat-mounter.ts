import Hyperchat from '../components/Hyperchat.svelte';
import tailwind from 'smelte/src/tailwind.css?inline';
import { isLiveTL } from '../ts/chat-constants';

const mount = (): void => {
  console.log('[HyperChat] mounted hyperchat as content script');

  document.querySelector('#player')?.remove();

  document.documentElement.style.cssText = 'background-color: transparent !important;';
  document.body.style.cssText = 'background-color: transparent !important;';

  const font = document.createElement('link');
  font.href = (
    'https://fonts.googleapis.com/css' +
    '?family=Roboto:100,300,400,500,700,900' +
    '|Material+Icons&display=swap'
  );
  font.rel = 'stylesheet';
  document.head.appendChild(font);

  const style = document.createElement('style');
  style.innerHTML = tailwind;
  document.head.appendChild(style);

  console.log(new Hyperchat({
    target: document.body
  }));
  setTimeout(() => {
    document.querySelector('yt-live-chat-app')?.remove();
  }, 1);
};

if (isLiveTL) {
  mount();
}
else {
  setTimeout(() => {
    if (document.querySelector('.hyperchat-root') === null) {
      mount();
    }
  }, 500);
}
