'use strict';

/**
 * monda service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::monda.monda');
