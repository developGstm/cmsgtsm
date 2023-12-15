'use strict';

module.exports = ({ strapi }) => {
  // registeration phase
  strapi.customFields.register({
    name: 'location',
    plugin: 'location-field',
    type: 'string'
  });
  strapi.customFields.register({
    name: 'country',
    plugin: 'location-field',
    type: 'string'
  });
  strapi.customFields.register({
    name: 'locality',
    plugin: 'location-field',
    type: 'string'
  });
};
