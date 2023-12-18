module.exports = [
  'strapi::errors',
    {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        directives: { "script-src": ["'self'", "'unsafe-inline'", "maps.googleapis.com"] },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
