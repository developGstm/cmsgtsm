module.exports = {
    routes: [
      {
        method: "GET",
        path: "/filterServiceGlobal/:type",
        handler: "servicio.serviceFilter",
        config: {
          auth:false
        },
      },
      {
        method: "GET",
        path: "/filterServiceGlobalSearch/:param",
        handler: "servicio.serviceFilterOne",
        config: {
          auth:false
        },
      },
    ]
 }
