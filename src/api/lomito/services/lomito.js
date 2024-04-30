'use strict';

/**
 * lomito service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::lomito.lomito');
