import HcButton from '../components/HyperchatButton.svelte';

const isLiveTL = false;
const isAndroid = false;
// DO NOT EDIT THE ABOVE LINES, they will be updated by webpack.
const isFirefox = navigator.userAgent.includes('Firefox');

const chatLoaded = () => {
  if (document.querySelector('.toggleButton')) {
    console.debug('HC Button already injected.');
    return;
  }

  document.body.style.minWidth = document.body.style.minHeight = '0px';
  const hyperChatEnabled = localStorage.getItem('HC:ENABLED') !== 'false';

  /** Inject HC button */
  const ytcPrimaryContent = document.querySelector('#primary-content');
  if (!ytcPrimaryContent) {
    console.error('Failed to find #primary-content');
    return;
  }
  const hcButton = new HcButton({
    target: ytcPrimaryContent
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', chatLoaded);
} else {
  chatLoaded();
}
