import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/submodules/chat/src/App.vue')
  },
  {
    path: '/review',
    name: 'Review',
    redirect: to => {
      const userAgentString = navigator.userAgent;
      const isFirefox = /Firefox/.exec(navigator.userAgent);
      const isAndroid = window.isAndroid || (window.chrome == null && !isFirefox);
      if (isAndroid) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.livetl.android';
      } else if (userAgentString.indexOf('Chrome') > -1) {
        window.location.href = 'https://livetl.app';
      } else if (userAgentString.indexOf('Firefox') > -1) {
        window.location.href = 'https://livetl.app';
      } else if (userAgentString.indexOf('Safari') > -1) {
        window.location.href = 'https://livetl.app';
      } else {
        window.location.href = 'https://livetl.app';
      }
    }
  }
];

const router = new VueRouter({
  routes
});

export default router;
