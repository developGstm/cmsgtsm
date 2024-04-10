'use strict';
// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const moment = require('moment')
const nodemailer = require("nodemailer");
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
          fecha: fecha
        },

      })

      return  {
        clientSecret: paymentIntent.client_secret,
        tarifa: {
          total: tarifaFind.precio,
          moneda: paqueteFind.moneda.titulo,
        }
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
      const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false, // Use `true` for port 465, `false` for all other ports
        auth: {
          user: "notificaciones@destinytravel.ai",
          pass: "N0t1D3st1n7",
        },
      });

      const info = await transporter.sendMail({
        from: '"Destiny Travel" <notificaciones@destinytravel.ai>', // sender address
        to: "emmanuel.a.pacheco@gmail.com", // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello world?", // plain text body
        html: "<b>Hello world?</b>", // html body
      });

      console.log("Message sent: %s", info.messageId);

    } catch (error) {
      console.log(error)
    }
  }
}));
