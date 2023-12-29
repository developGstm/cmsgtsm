module.exports = [
  'strapi::errors',
    {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: { 
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "*.digitaloceanspaces.com"
          ],
          "media-src": ["'self'", "data:", "blob:"],
          upgradeInsecureRequests: null,
          "script-src": ["'self'", "'unsafe-inline'", "maps.googleapis.com"] 
        },
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
