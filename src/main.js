import "./assets/main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createDefaultAdmin } from "./services/auth";
const app = createApp(App);

app.use(router);

createDefaultAdmin().then(() => {
  app.mount("#app");
});
