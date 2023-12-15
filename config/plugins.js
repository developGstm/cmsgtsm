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
  // ...
})