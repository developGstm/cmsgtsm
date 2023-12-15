'use strict';

module.exports = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('location-field')
      .service('myService')
      .getWelcomeMessage();
  },
});
