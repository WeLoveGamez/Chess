import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Menu from '../views/Menu.vue';
import Board from '../components/Board.vue';
declare module 'vue-router' {
  interface RouteMeta {
    guard: 'auth' | 'guest';
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Menu',
    component: Menu,
  },
  {
    path: '/Board',
    name: 'Board',
    component: Board,
  },
];
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// router.beforeEach(async (to, from, next) => {
//   const requiresAuth = to.meta.guard === 'auth';
//   // const currentUser = await getCurrentUser();

//   if (to.meta.guard === 'guest') {
//     next();
//   } else if (requiresAuth /*&& !currentUser*/) {
//     next('/');
//   } else if (!requiresAuth /*&& currentUser*/) {
//     next('/home');
//   } else {
//     next();
//   }
// });

export default router;
