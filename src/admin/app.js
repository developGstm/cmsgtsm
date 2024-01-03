// @ts-ignore
import icon from './extensions/logotipo.png';

const config = {
  // Replace the Strapi logo in auth (login) views
  auth: {
    icon,
  },
  // Replace the favicon
  head: {
    favicon: icon,
  },
  // Replace the Strapi logo in the main navigation
  menu: {
    icon,
  },
  // Extend the translations
  translations: {
    en: {
      "app.components.LeftMenu.navbrand.title": "GSTM Dashboard",
      "Auth.form.welcome.title": "Welcom to GSTM CMS",
      "Auth.form.welcome.subtitle": "Log in to your account"
    },
  },
  // Disable video tutorials
  tutorials: false,
  // Disable notifications about new Strapi releases
  notifications: { releases: false },
};

const bootstrap = (app) => {
  console.log(app);
};

export default {
  config,
  bootstrap,
};