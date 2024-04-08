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
      method: "GET",
      path: "/paymentRetrive/:idsecret",
      handler: "ordenes-destiny.paymentRetrive",
      config: {
        auth:false
      },
    },
    {
      method: "POST",
      path: "/webhook",
      handler: "ordenes-destiny.webHook",
      config: {
        auth:false
      },
    },
  ],
};
