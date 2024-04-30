'use strict';
// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * lomito controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::lomito.lomito', ({ strapi }) => ({
  async paymentIntent(ctx) {
    try {
      const { nombre, apellido ,correo, telefono, boletos, total} = ctx.request.body;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'MXN',
        amount: total * 100,
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
        metadata: {
          nombre: `${nombre} ${apellido}`,
          correo,
          telefono,
          boletos:'primera pasada'
        },
      })

      return  {
        idPaymentIntent: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      }
    } catch (error) {
      ctx.badRequest("Post report controller error", { moreDetails: error });
    }
  },
  async updatePaymentIntent(ctx) {
    try {
      const { idPaymentIntent,nombre, apellido ,correo, telefono, boletos, total} = ctx.request.body;
      await stripe.paymentIntents.update(idPaymentIntent,
        {
          amount: total*100,
          metadata: {
            nombre: `${nombre} ${apellido}`,
            correo,
            telefono,
            boletos:'prueba'
          }
        }
      );

      return  {
       update: 'ok',
      }
    } catch (error) {
      ctx.badRequest("Post report controller error", { moreDetails: error });
    }
  }
}));
