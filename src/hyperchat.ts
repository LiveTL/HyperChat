import Hyperchat from './components/Hyperchat.svelte';
import 'smelte/src/tailwind.css';

const hyperchat = new Hyperchat({
  target: document.body
});

export default hyperchat;
