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
  ],
};
