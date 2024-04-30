module.exports = {
  routes: [
    {
      method: "POST",
      path: "/lomito/paymentIntent",
      handler: "lomito.paymentIntent",
      config: {
        auth:false
      },
    },
    {
      method: "POST",
      path: "/lomito/updatePaymentIntent",
      handler: "lomito.updatePaymentIntent",
      config: {
        auth:false
      },
    },
  ]
}
