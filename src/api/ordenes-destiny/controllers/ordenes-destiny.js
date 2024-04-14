'use strict';
// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const moment = require('moment')
const Resend = require('resend').Resend

/**
 * ordenes-destiny controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::ordenes-destiny.ordenes-destiny',({ strapi }) => ({
  async paymentIntent(ctx) {
    try {
      const { nombre, apellido ,correo, telefono, paquete, fecha } = ctx.request.body;
      let financiamiento = null
      const createCustomer = await stripe.customers.create({
        name: `${nombre} ${apellido}`,
        email: correo
      })

      const paqueteFind = await strapi.entityService.findOne('api::servicios-destiny.servicios-destiny',paquete.id,{
        fields: ['titulo','descripcion','ubiacion','url','categoria','minimo_apartado','publishedAt'],
        populate: {
          tipos_servicio: {
            populate: '*'
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

      const tarifaFind = paqueteFind.tipos_servicio[0]?.Tarifas?.find(item => item.id === paquete.tarifaId)
      let porcentajeFinanciamiento = tarifaFind.precio*(1.5/100)
      let totalPaquete = (tarifaFind.precio + porcentajeFinanciamiento) - paqueteFind.minimo_apartado

      if (moment(fecha).diff(moment(), 'months') > 3) {
        if (moment(fecha).diff(moment(), 'months') > 12) {
          financiamiento = [
           {
            titulo:'3 meses',
            npagos:3,
            cantidadPago: totalPaquete / 3
           },
           {
            titulo:'6 meses',
            npagos:6,
            cantidadPago: totalPaquete / 6
           },
           {
            titulo:'12 meses',
            npagos:12,
            cantidadPago: totalPaquete / 12
           }
          ]
         } else if (moment(fecha).diff(moment(), 'months') > 6) {
          financiamiento = [
            {
              titulo:'3 meses',
              npagos:3,
              cantidadPago: totalPaquete / 3
            },
            {
              titulo:'6 meses',
              npagos:6,
              cantidadPago: totalPaquete / 6
            }
          ]
        } else if (moment(fecha).diff(moment(), 'months') > 3) {
          financiamiento = [
            {
              titulo:'3 meses',
              npagos:3,
              cantidadPago: totalPaquete / 3
            },
          ]
         }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        currency: paqueteFind?.moneda[0]?.titulo,
        amount: tarifaFind.precio * 100,
        receipt_email: correo,
        automatic_payment_methods: {
          enabled: true
        },
        payment_method_options: {
          card: {
            installments: {
              enabled: true,
            },
          },
        },
        customer: createCustomer.id,
        metadata: {
          nombre: `${nombre} ${apellido}`,
          correo,
          telefono,
          paquete: paquete.id,
          tarifa: paquete.tarifa,
          estatus_pago: paquete.estatus_pago,
          plataforma_pago: paquete.plataforma_pago,
          fecha: fecha,
        },

      })

      return  {
        clientSecret: paymentIntent.client_secret,
        idPaymentIntent: paymentIntent.id,
        tarifa: {
          total: tarifaFind?.precio,
          despliegue_cargos: {
            porcentajeFinanciamiento,
            totalPaquete
          },
          moneda: paqueteFind?.moneda[0]?.titulo,
          financiamiento
        }
      }
    } catch (error) {

    }
  },async updateIntentPayment(ctx, next) {
    try {
      const { idPaymentIntent, paquete } = ctx.request.body;

      const paqueteFind = await strapi.entityService.findOne('api::servicios-destiny.servicios-destiny',paquete.id,{
        fields: ['titulo','descripcion','ubiacion','url','categoria','minimo_apartado','publishedAt'],
        populate: {
          tipos_servicio: {
            populate: '*'
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
      const tarifaFind = paqueteFind.tipos_servicio[0]?.Tarifas?.find(item => item.id === paquete.tarifaId)
      if (paquete?.estatus_pago === 'financiamiento') {

      }
      const updatePayment = await stripe.paymentIntents.update(idPaymentIntent,
        {
          amount: paquete.estatus_pago === 'financiamiento' ? paqueteFind?.minimo_apartado * 100 : tarifaFind.precio * 100,
          metadata: {
            estatus_pago: paquete.estatus_pago,
          }
        }
      );
      return  {
        tarifa: {
          total: paquete.estatus_pago === 'financiamiento' ? paqueteFind?.minimo_apartado : tarifaFind.precio,
          despliegue_cargos: [],
          moneda: paqueteFind?.moneda[0]?.titulo,
        }
      }
    } catch (error) {
      ctx.badRequest("Post report controller error", { moreDetails: error });
    }
  },
  async paymentRetrive(ctx, next) {
    try {
      const { idsecret } = ctx.params
      const paymentIntent = await stripe.paymentIntents.retrieve(idsecret);

      return {
        paymentRetrive: paymentIntent
      }
    } catch (error) {
      ctx.badRequest("Post report controller error", { moreDetails: error });
    }
  },
  async webHook(ctx, next) {
    try {
      const event  = ctx.request.body;
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log(paymentIntent)
          const paquete = await strapi.service('api::servicios-destiny.servicios-destiny').findOne(paymentIntent.metadata.paquete)
          await strapi.service('api::ordenes-destiny.ordenes-destiny').create({
            data: {
              nombre: paymentIntent.metadata.nombre,
              telefono: paymentIntent.metadata.telefono,
              correo: paymentIntent.metadata.correo,
              paquete: {
                titulo: paquete.titulo,
                tarifa: paymentIntent.metadata.tarifa,
              },
              plataforma_pago: paymentIntent.metadata.plataforma_pago,
              id_pago: paymentIntent.id,
              estatus_pago: paymentIntent.metadata.estatus_pago,
              fecha: moment(paymentIntent.metadata.fecha).format('YYYY-MM-DD')
            }
          })
          // Then define and call a method to handle the successful payment intent.
          // handlePaymentIntentSucceeded(paymentIntent);
          break;
        case 'payment_method.attached':
          const paymentMethod = event.data.object;
          // Then define and call a method to handle the successful attachment of a PaymentMethod.
          // handlePaymentMethodAttached(paymentMethod);
          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return {received: true}
    } catch (error) {
      ctx.badRequest("Post report controller error", { moreDetails: error });
    }
  },
  async emailPrueba(ctx, next){
    try {
      const { email } = ctx.params
      const resend = new Resend('re_3hrvSVqW_4d9yTAy3zMK8BgkNq71Ho931')
      await resend.contacts.create({
        email: email,
        audienceId: '8d4147a1-a1b1-4bcd-aa69-d9fb8edc1a2c',
      });
      return {send: true}
    } catch (error) {
      console.log(error)
    }
  }
}));
