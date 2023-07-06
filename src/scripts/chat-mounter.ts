import Hyperchat from '../components/Hyperchat.svelte';
import tailwind from 'smelte/src/tailwind.css?inline';

const mount = (): void => {
  console.log('[HyperChat] mounted hyperchat as content script');
  document.head.innerHTML = '';
  document.body.innerHTML = '';

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
};
mount();
