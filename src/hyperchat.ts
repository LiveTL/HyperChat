import Hyperchat from './components/Hyperchat.svelte';
import 'smelte/src/tailwind.css';
import { stripYoutubePlayerStyles } from './ts/chat-utils';

stripYoutubePlayerStyles();

const hyperchat = new Hyperchat({
  target: document.body
});

export default hyperchat;
