'use strict';
// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const moment = require('moment')
/**
 * ordenes-destiny controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::ordenes-destiny.ordenes-destiny',({ strapi }) => ({
  async paymentIntent(ctx) {
    try {
      const { nombre, apellido ,correo, telefono, paquete, fecha } = ctx.request.body;
      const createCustomer = await stripe.customers.create({
        name: `${nombre} ${apellido}`,
        email: correo
      })

      const paymentIntent = await stripe.paymentIntents.create({
        currency:"usd",
        amount: 1999,
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
          fecha: fecha
        },

      })

      return  {
        clientSecret: paymentIntent.client_secret,
      }
    } catch (error) {
      return  { error_message: error}
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
  }
}));
