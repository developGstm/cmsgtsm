module.exports = {
  routes: [
    {
      method: "POST",
      path: "/paymentIntent",
      handler: "ordenes-destiny.paymentIntent",
      config: {
        auth:false
      },
    },
    {
      method: "POST",
      path: "/paymentIntentUpdate",
      handler: "ordenes-destiny.updateIntentPayment",
      config: {
        auth:false
      },
    },
    {
      method: "GET",
      path: "/paymentRetrive/:idsecret",
      handler: "ordenes-destiny.paymentRetrive",
      config: {
        auth:false
      },
    },
    {
      method: "POST",
      path: "/paymentRetrive/webhook",
      handler: "ordenes-destiny.webHook",
      config: {
        auth:false
      },
    },
    {
      method: "GET",
      path: "/pruebaEmail",
      handler: "ordenes-destiny.emailPrueba",
      config: {
        auth:false
      },
    },
  ],
};
