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
      const { nombre, apellido ,correo, telefono, paquete} = ctx.request.body;
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
      let comicionTarjeta = tarifaFind.precio*(3.6/100)
      let total = (tarifaFind.precio + comicionTarjeta)
      let restantePaqueteFinanciado = (total + porcentajeFinanciamiento) - paqueteFind.minimo_apartado


      if (moment(paquete?.fecha_salida).diff(moment(), 'months') > 3) {
        if (moment(paquete?.fecha_salida).diff(moment(), 'months') > 12) {
          financiamiento = [
           {
            titulo:'3 meses',
            npagos:3,
            cantidadPago: restantePaqueteFinanciado / 3
           },
           {
            titulo:'6 meses',
            npagos:6,
            cantidadPago: restantePaqueteFinanciado / 6
           },
           {
            titulo:'12 meses',
            npagos:12,
            cantidadPago: restantePaqueteFinanciado / 12
           }
          ]
         } else if (moment(paquete?.fecha_salida).diff(moment(), 'months') > 6) {
          financiamiento = [
            {
              titulo:'3 meses',
              npagos:3,
              cantidadPago: restantePaqueteFinanciado / 3
            },
            {
              titulo:'6 meses',
              npagos:6,
              cantidadPago: restantePaqueteFinanciado / 6
            }
          ]
        } else if (moment(paquete?.fecha_salida).diff(moment(), 'months') > 3) {
          financiamiento = [
            {
              titulo:'3 meses',
              npagos:3,
              cantidadPago: restantePaqueteFinanciado / 3
            },
          ]
         }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        currency: paqueteFind?.moneda[0]?.titulo,
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
        customer: createCustomer.id,
        metadata: {
          nombre: `${nombre} ${apellido}`,
          correo,
          telefono,
          tarifa: tarifaFind?.titulo,
          paquete: paquete?.id,
          estatus_pago: paquete?.estatus_pago,
          plataforma_pago: paquete?.plataforma_pago,
          total_pago:paquete?.estatus_pago === 'financiamiento' ? paqueteFind?.minimo_apartado : total,
          precio_paquete:tarifaFind?.precio,
          total:total,
          descuento:paquete?.descuento,
          fecha_salida: paquete?.fecha_salida,
          fecha_llegada:paquete?.fecha_llegada,
          fecha_evento: paquete?.fecha_evento,
          usuario:paquete?.usuario,
          concepto_pago:paquete?.concepto_pago,
          valorFinanciado: paquete?.estatus_pago === 'completo' ? null : restantePaqueteFinanciado,
          fecha_pago: moment().format('YYYY-MM-DD'),
          financiamiento: {}
        },

      })

      return  {
        clientSecret: paymentIntent.client_secret,
        idPaymentIntent: paymentIntent.id,
        tarifa: {
          total: tarifaFind?.precio,
          despliegue_cargos: {
            porcentajeFinanciamiento,
            restantePaqueteFinanciado: restantePaqueteFinanciado,
            comicionTarjeta,
            total_financiado: total + porcentajeFinanciamiento,
            total:total,
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
      let porcentajeFinanciamiento = tarifaFind.precio*(1.5/100)
      let comicionTarjeta = tarifaFind.precio*(3.6/100)
      let total = (tarifaFind.precio + comicionTarjeta)
      let restantePaqueteFinanciado = (total + porcentajeFinanciamiento) - paqueteFind.minimo_apartado

      await stripe.paymentIntents.update(idPaymentIntent,
        {
          amount: paquete.estatus_pago === 'financiamiento' ? paqueteFind?.minimo_apartado * 100 : tarifaFind.precio * 100,
          metadata: {
            estatus_pago: paquete.estatus_pago,
            concepto_pago:paquete?.concepto_pago,
            valorFinanciado: paquete?.estatus_pago === 'completo' ? null : total + porcentajeFinanciamiento,
            financiamiento_pagado: paquete?.estatus_pago === 'completo' ? null : paqueteFind?.minimo_apartado,
            restanteFinanciamiento:  paquete?.estatus_pago === 'completo' ? null : restantePaqueteFinanciado,
            total_pago:paquete?.estatus_pago === 'financiamiento' ? paqueteFind?.minimo_apartado : total,
            total:paquete?.estatus_pago === 'financiamiento' ? total + porcentajeFinanciamiento : total,
            cantidad_de_pagos: paquete?.estatus_pago === 'financiamiento' ? paquete?.cantidadPagos : null,
            valor_de_cada_pago: paquete?.estatus_pago === 'financiamiento' ? paquete?.valorDePago : null,
            restante_por_pagar: paquete?.estatus_pago === 'financiamiento' ? restantePaqueteFinanciado : null,
            total_financiado: paquete?.estatus_pago === 'financiamiento' ? restantePaqueteFinanciado : null
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
          console.log('aca entramos')
          const paymentIntent = event.data.object;
          console.log(paymentIntent)
          const paquete = await strapi.service('api::servicios-destiny.servicios-destiny').findOne(paymentIntent.metadata.paquete)
          const data =await strapi.service('api::ordenes-destiny.ordenes-destiny').create({
            data: {
              nombre: paymentIntent.metadata.nombre,
              telefono: paymentIntent.metadata.telefono,
              correo: paymentIntent.metadata.correo,
              paquete: {
                titulo: paquete.titulo,
                tarifa: paymentIntent.metadata.tarifa,
                precio_paquete: paymentIntent?.metadata?.precio_paquete,
                descuento: paymentIntent?.metadata?.descuento,
                valor_total: paymentIntent?.metadata?.total,
                fecha_salida: paymentIntent?.metadata?.fecha_salida,
                fecha_llegada: paymentIntent?.metadata?.fecha_llegada,
                fecha_evento: paymentIntent?.metadata?.fecha_evento,
                pagos: [
                  {
                    plataforma_pago: 'strapi',
                    id_pago: paymentIntent.id,
                    concepto: paymentIntent?.metadata?.concepto_pago,
                    fecha_pago: moment().format('YYYY-MM-DD'),
                    total_pago: new Intl.NumberFormat('en-IN').format((paymentIntent?.amount/100))
                  }
                ],
                financiamiento: {
                  cantidad_de_pagos: paymentIntent?.metadata?.cantidad_de_pagos,
                  pagos_restantes: paymentIntent?.metadata?.cantidad_de_pagos,
                  valor_de_cada_pago: paymentIntent?.metadata?.valor_de_cada_pago,
                  restante_por_pagar: paymentIntent?.metadata?.restante_por_pagar,
                  total_financiado: paymentIntent?.metadata?.total_financiado
                }
              },
              plataforma_pago: paymentIntent.metadata.plataforma_pago,
              estatus_pago: paymentIntent.metadata.estatus_pago,
            }
          })
          console.log(data)
          const resend = new Resend('re_3hrvSVqW_4d9yTAy3zMK8BgkNq71Ho931')
          await resend.emails.send({
            from: 'Destiny Travel <no-replay@destinytravel.ai>',
            to: [`${paymentIntent.metadata.correo}`],
            subject: '¡Recibimos tu Reserva!',
            html: `<table style="background-color: #010417;" width="100%">
            <tbody>
              <tr>
                <td align="center">
                  <table style="max-width:600px;padding:0 15px 15px 0;Margin-top:24px;border:0;" width="100%">
                    <tbody>
                      <tr>
                        <td align="left" style="padding:15px 0 15px 0">
                          <a href="https://www.destinytravel.ai/">
                            <img style="display:block" width="180" src="https://www.destinytravel.ai/static/media/logo-01.27164a87aaeb1997f131.png" alt="">
                          </a>
                        </td>
                        <td width="44px">
                          <a href="https://www.facebook.com/experience.destiny">
                            <img width="40px" src="https://almacenamientocms.nyc3.digitaloceanspaces.com/uploads/d3227f8cbace11440fcca0b7958c998a.png" alt=""></a>
                        </td>
                        <td width="44px">
                          <a href="https://www.instagram.com/experience.destiny">
                            <img width="40px" src="https://almacenamientocms.nyc3.digitaloceanspaces.com/uploads/7cf04211a1840761652afa9a1cfecd43.png" alt=""></a>
                        </td>
                        <td width="44px">
                          <a href="https://www.tiktok.com/@experience.destiny">
                            <img width="40px" src="https://almacenamientocms.nyc3.digitaloceanspaces.com/uploads/11044f5e9a3f957c9b4c486950e33fd0.png" alt=""></a>
                        </td>
                      </tr>
                      <table  style="max-width:600px;padding:0 15px 15px 0;border:0;" width="100%">
                        <tr>
                          <td>
                            <img height="auto" src="https://almacenamientocms.nyc3.digitaloceanspaces.com/uploads/3ef2a29b7cefb649562775df2ad0e7de.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;min-width:100%;width:100%;max-width:100%;font-size:13px" width="auto" class="CToWUd" data-bit="iit">
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <h1 style="color:#ffff; font-family: BinancePlex, Arial, PingFangSC-Regular, 'Microsoft YaHei', sans-serif; text-align: center;">
                              ¡Hola,${paymentIntent.metadata.nombre}!
                            </h1>
                            <h1 style="color:#ffff; font-family: BinancePlex, Arial, PingFangSC-Regular, 'Microsoft YaHei', sans-serif; text-align: center;">
                              ¡TU VIAJE COMIENZA HOY!
                            </h1>
                            <span style="color:#ffff; font-family: BinancePlex, Arial, PingFangSC-Regular, 'Microsoft YaHei', sans-serif; text-align: center;">
                              Dentro de las próximas 24hrs uno de nuestros asesores se pondrá en contacto contigo para continuar con el proceso
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 30px;">
                            <div style="color:#ffff; font-family: BinancePlex, Arial, PingFangSC-Regular, 'Microsoft YaHei', sans-serif; text-align: center; border: 5px solid #000;">
                              <strong>Numero de reserva</strong>
                              <h2 style="padding: 0; margin: 0; color: #ffd603;">${data.id}</h2>
                            </div>
                          </td>
                        </tr>
                      </table>
                      <table>
                        <tbody>
                          <tr>
                            <td style="color:#ffff; font-family: BinancePlex, Arial, PingFangSC-Regular, 'Microsoft YaHei', sans-serif; text-align: center; border: 5px solid #000; font-size: 13px; padding-bottom: 30px;">
                              Derechos reservados «Copyright» <a href="https://www.destinytravel.ai" style="color: #ffff !important; text-decoration: none;" target="_blank">www.destinytravel.ai</a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>`,
          });
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
