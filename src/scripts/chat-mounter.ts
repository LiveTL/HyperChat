import Hyperchat from '../components/Hyperchat.svelte';
import tailwind from 'smelte/src/tailwind.css?inline';
import { isLiveTL } from '../ts/chat-constants';
import { stripYoutubePlayerShell, stripYoutubePlayerStyles } from '../ts/chat-utils';

const MOUNT_ROOT_ID = 'hyperchat-mount-root';
const FONT_LINK_ID = 'hyperchat-font-link';
const TAILWIND_STYLE_ID = 'hyperchat-tailwind-style';

const stripEmbedArtifacts = (): void => {
  stripYoutubePlayerShell();
};

const ensureHeadAssets = (): void => {
  if (document.getElementById(FONT_LINK_ID) === null) {
    const font = document.createElement('link');
    font.id = FONT_LINK_ID;
    font.href = (
      'https://fonts.googleapis.com/css' +
      '?family=Roboto:100,300,400,500,700,900' +
      '|Material+Icons&display=swap'
    );
    font.rel = 'stylesheet';
    document.head.appendChild(font);
  }

  if (document.getElementById(TAILWIND_STYLE_ID) === null) {
    const style = document.createElement('style');
    style.id = TAILWIND_STYLE_ID;
    style.innerHTML = tailwind;
    document.head.appendChild(style);
  }
};

const retainOnlyMountRoot = (root: HTMLDivElement): void => {
  for (const child of Array.from(document.body.children)) {
    if (child !== root) {
      child.remove();
    }
  }
  if (!document.body.contains(root)) {
    document.body.appendChild(root);
  }
};

const ensureMountRoot = (): HTMLDivElement => {
  let root = document.getElementById(MOUNT_ROOT_ID) as HTMLDivElement | null;
  if (root === null) {
    root = document.createElement('div');
    root.id = MOUNT_ROOT_ID;
  }

  root.style.cssText = 'position: fixed; inset: 0; overflow: hidden; z-index: 2147483647;';
  retainOnlyMountRoot(root);

  return root;
};

const mount = (): void => {
  console.log('[HyperChat] mounting hyperchat in embed frame');
  stripEmbedArtifacts();
  stripYoutubePlayerStyles();
  document.documentElement.style.cssText = 'background-color: transparent !important;';
  document.body.style.cssText = 'margin: 0 !important; background-color: transparent !important; overflow: hidden !important;';

  ensureHeadAssets();
  const mountRoot = ensureMountRoot();

  if (mountRoot.querySelector('.hyperchat-root') === null) {
    // Create a dedicated root so YouTube cannot reinsert player artifacts under the UI.
    console.log(new Hyperchat({
      target: mountRoot
    }));
  }

  new MutationObserver(() => {
    stripEmbedArtifacts();
    if (!document.body.contains(mountRoot) || document.body.children.length !== 1) {
      retainOnlyMountRoot(mountRoot);
    }
  }).observe(document.body, {
    childList: true
  });

  if (document.head != null) {
    new MutationObserver(stripYoutubePlayerStyles).observe(document.head, {
      childList: true,
      subtree: true
    });
  }
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
