<template>
  <a :href="href" @click="openLink" target="_blank">
    <slot></slot>
  </a>
</template>
<script>
export default {
  name: 'CustomLink',
  props: ['href'],
  methods: {
    openLink(event) {
      let href = event.target.href;
      if (window.location.hash.includes('isLiveTL') && href.includes('#/')) {
        href = 'https://livetl.app/hyperchat';
      }
      event.preventDefault();
      if (window.Android) {
        window.Android.open(href);
      } else {
        window.open(href);
      }
    }
  }
};
</script>
