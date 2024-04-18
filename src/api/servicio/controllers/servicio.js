'use strict';
const { sanitize } = require('@strapi/utils')
/**
 * servicio controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::servicio.servicio', ({strapi}) => ({
    async serviceFilter(ctx, next) {
      try {
        const data = await strapi.entityService.findMany('api::servicio.servicio',{
          fields: ['titulo','descripcion','locacion','url','politicas','publishedAt'],
          filters: {
            $not:{
              publishedAt: null
            }
          },
          populate: {
            Tipo_Servicio: {
              populate: {
                Tarifas: {
                  populate: '*'
                }
              }
            },
            portada: {
              url: true
            },
            galeria: {
              populate: '*'
            },
            incluido: {
              populate: '*'
            },
            preguntas_frecuentes: {
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
          const stringServicio = JSON.stringify(item.Tipo_Servicio);
          if (stringServicio.includes(`tipos-servicios.${type}`)) {
            return item
          }
        })

        const contentType = strapi.contentType("api::servicio.servicio");
        const sanitizedEntity = await sanitize.contentAPI.output(newData,contentType);
        return { data: sanitizedEntity };
      } catch (error) {
          ctx.badRequest("Post report controller error", { moreDetails: error });
      }
    },
    async serviceFilterOne(ctx, next) {
      try {
        const { param } = ctx.params
        const data = await strapi.entityService.findMany('api::servicio.servicio',{
          fields: ['titulo','descripcion','locacion','url','politicas','publishedAt'],
          filters: {
            url: {
              $eq: param
            },
            publishedAt: {
              $not: null
            }
          },
          populate: {
            Tipo_Servicio: {
              populate: {
                Tarifas: {
                  populate: '*'
                }
              }
            },
            portada: {
              url: true
            },
            galeria: {
              populate: '*'
            },
            incluido: {
              populate: '*'
            },
            preguntas_frecuentes: {
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
        const contentType = strapi.contentType("api::servicio.servicio");
        const sanitizedEntity = await sanitize.contentAPI.output(data,contentType);
        return { data: sanitizedEntity };
      } catch (error) {
        ctx.badRequest("Post report controller error", { moreDetails: error });
      }
    }
}));
