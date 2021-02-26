import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: "about" */ '@/submodules/chat/src/App.vue')
  }
];

const router = new VueRouter({
  routes
});

export default router;
