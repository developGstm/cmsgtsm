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
    ]
 }