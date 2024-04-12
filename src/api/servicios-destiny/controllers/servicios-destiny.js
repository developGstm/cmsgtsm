'use strict';

/**
 * servicios-destiny controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { sanitize } = require('@strapi/utils')

module.exports = createCoreController('api::servicios-destiny.servicios-destiny',({strapi})=> ({
  async serviceFilter(ctx, next) {
    try {
      const data = await strapi.entityService.findMany('api::servicios-destiny.servicios-destiny',{
        fields: ['titulo','descripcion','ubiacion','url','minimo_apartado','categoria','publishedAt'],
        filters: {
          $not:{
            publishedAt: null
          }
        },
        populate: {
          tipos_servicio: {
            populate: {
              Tarifas: {
                populate: '*'
              }
            }
          },
          portada: {
            url: true
          },
          incluye: {
            populate: '*'
          },
          moneda: {
            titulo: true
          },
          unidad: {
            titulo: true
          }
        }
      })

      const { type } = ctx.params
      const newData = data.filter(item => {
        const stringServicio = JSON.stringify(item.tipos_servicio);
        if (stringServicio.includes(`tipos-servicios.${type}`)) {
          return item
        }
      })
      const contentType = strapi.contentType("api::servicios-destiny.servicios-destiny");
      const sanitizedEntity = await sanitize.contentAPI.output(newData,contentType);
      return { data: sanitizedEntity };
    } catch (error) {
      ctx.badRequest("Post report controller error", { moreDetails: error });
    }
  },
  async serviceFilterOne(ctx, next) {
    try {
      const { param } = ctx.params
      const data = await strapi.entityService.findMany('api::servicios-destiny.servicios-destiny',{
        fields: ['titulo','descripcion','ubiacion','url','minimo_apartado','categoria','publishedAt','politicas'],
        filters: {
          url: {
            $eq: param
          },
          publishedAt: {
            $not: null
          }
        },
        populate: {
          tipos_servicio: {
            populate: {
              Tarifas: {
                populate: '*'
              }
            }
          },
          portada: {
            url: true
          },
          incluye: {
            populate: '*'
          },
          moneda: {
            titulo: true
          },
          unidad: {
            titulo: true
          }
        }
      })
      const contentType = strapi.contentType("api::servicios-destiny.servicios-destiny");
      const sanitizedEntity = await sanitize.contentAPI.output(data,contentType);
      return { data: sanitizedEntity };
    } catch (error) {
      ctx.badRequest("Post report controller error", { moreDetails: error });
    }
  }
}));
