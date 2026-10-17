import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
const app = createApp(App);

app.use(router);

app.mount("#app");

if (import.meta.env.DEV && new URLSearchParams(location.search).has('a11y')) {
  router.isReady().then(() => import('./a11y-check').then(({ runAccessibilityCheck }) => runAccessibilityCheck()));
}
