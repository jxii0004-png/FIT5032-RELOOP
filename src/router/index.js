import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { authReady, getCurrentUser } from "../services/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/email",
      name: "email",
      component: () => import("../views/EmailView.vue"),
      meta: { requiresAuth: true, role: "admin" },
    },
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
      meta: {
        requiresAuth: true,
        role: "admin",
      },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
  ],
});

router.beforeEach(async (to) => {
  await authReady;
  const currentUser = getCurrentUser();

  if (to.meta.requiresAuth && !currentUser) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  if (to.meta.role && currentUser?.role !== to.meta.role) {
    return "/";
  }
});
export default router;
