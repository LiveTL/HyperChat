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
      if (window.Android) {
        event.preventDefault();
        window.Android.open(event.target.href);
      }
    }
  }
};
</script>
