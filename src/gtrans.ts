import { get } from 'svelte/store';
import { commentTranslateTargetLang, googleTranslateLoaded } from './ts/storage';

const w = window as any;
if (!w.googleTranslateElementInit) {
  w.googleTranslateElementInit = async () => {
    googleTranslateLoaded.set(true);
    setTimeout(() => {
      const e: HTMLInputElement | null = document.querySelector('.goog-te-combo');
      if (e) {
        e.value = get(commentTranslateTargetLang);
        e.dispatchEvent(new Event('change'));
      }
    }, 1000);
  };
}
