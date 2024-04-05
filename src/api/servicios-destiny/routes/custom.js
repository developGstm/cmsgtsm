module.exports = {
  routes: [
    {
      method: "GET",
      path: "/filterService/:type",
      handler: "servicios-destiny.serviceFilter",
      config: {
        auth:false
      },
    },
    {
      method: "GET",
      path: "/filterServiceSearch/:param",
      handler: "servicios-destiny.serviceFilterOne",
      config: {
        auth:false
      },
    },
  ],
};
