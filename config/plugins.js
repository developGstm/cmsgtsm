module.exports = ({ env })  => ({
  // ...
  'location-field': {
    enabled: true,
    resolve: './src/plugins/location-field',
    config: {
			fields: ["photo", "rating", "address_components", "formatted_address"], // optional
			// You need to enable "Autocomplete API" and "Places API" in your Google Cloud Console
			googleMapsApiKey: "AIzaSyAzFckwguZqSQzE_lCDDCFD4T9WgW7etfQ",
			// See https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest
			autocompletionRequestOptions: {
        language: 'es',
      },
		},
  },
  upload: {
    config: {
      provider: "strapi-provider-upload-do", 
      providerOptions: {
        key: env('DO_SPACE_ACCESS_KEY'),
        secret: env('DO_SPACE_SECRET_KEY'),
        endpoint: env('DO_SPACE_ENDPOINT'),
        space: env('DO_SPACE_BUCKET'),
      }
    },
  },
  // ...
})