'use strict';
// Content script that will be injected in any frame with src https://www.youtube.com/live_chat* AND
// any child about:blank/about:srcdoc frames, including the about:blank (actually about:srcdoc) frame
// containing HyperChat.
// This filters for that particular HyperChat frame, dynamically importing hyperchat(.bundle.js).
// This is a workaround for:
// a) The HyperChat frame needing to be about:blank/about:srcdoc to avoid cross origin issues so that
//    e.g. Google Translate extension can access its contents.
// b) hyperchat.bundle.js needing to be in extension's namespace for chrome.runtime access.
//    If that frame's document simply uses a <script> element to import hyperchat.bundle.js,
//    it would be in the page's namespace rather than the extension's content script namespace.
// c) manifest.json's built-in matching functionality cannot match ONLY the about:blank/about:srcdoc
//    frame we want without matching the parent https://www.youtube.com/live_chat* frame,
//    hence the need for the frameElement check below.
// d) While this check could go in hyperchat.ts itself, that's a heavyweight script full of
//    boilerplate that should only be loaded when necessary; hence this lightweight helper script.
console.log('hyperchat-frame', frameElement);
if (frameElement !== null && frameElement.id === 'hyperchat') {
    console.log('importing hyperchat');
    import('./hyperchat.bundle.js');
}
