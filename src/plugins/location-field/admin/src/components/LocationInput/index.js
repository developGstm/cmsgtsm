import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { TextInput } from '@strapi/design-system/';
import { Stack } from '@strapi/design-system/';
import { Button } from '@strapi/design-system/';
import { Textarea } from '@strapi/design-system';
import { NumberInput, Flex, Box } from "@strapi/design-system";
import { Combobox } from "@strapi/design-system";
import { ComboboxOption } from "@strapi/design-system";
import { request  } from '@strapi/helper-plugin'
import { Loader } from "@googlemaps/js-api-loader";
import { find } from '../../../../../../../config/middlewares';
import axios from 'axios';


export default function Index({
	onChange,
	value,
	name,
	attribute,
	error,
	required,
}) {
	const [apiKey, setApiKey] = useState(null);
	const [fields, setFields] = useState(null);
	const [loader, setLoader] = useState(null);
	const [autocompletionRequestOptions, setAutocompletionRequestOptions] =
		useState(null);
	const [textValue, setTextValue] = useState("" || ((value && value !== "null") ? JSON.parse(value).description : ""));

	const getConfigDetails = async () => {
		const { signal } = new AbortController();
		const { fields, autocompletionRequestOptions, googleMapsApiKey } =
			await request("/location-field/config", {
				method: "GET",
				signal,
			});
		return { fields, autocompletionRequestOptions, googleMapsApiKey };
	};


	React.useEffect(() => {
		getConfigDetails().then((config) => {
			setApiKey(config.googleMapsApiKey);
			config.fields = config.fields || [];
			if (!config.fields.includes("geometry")) {
				config.fields.push("geometry");
			}
			setFields(config.fields);
			setAutocompletionRequestOptions(config.autocompletionRequestOptions);
		});
	}, []);

	React.useEffect(() => {
		if (apiKey) {
			const loader = new Loader({
				apiKey,
				version: "weekly",
				libraries: ["places"],
			});
			setLoader(loader);
		}
	}, [apiKey]);

	// if "geometry" is not in the fields array, add it
	React.useEffect(() => {
		if (fields && !fields.includes("geometry")) {
			fields.push("geometry");
		}
	}, [fields]);

	const [predictions, setPredictions] = useState([]);

	const handleInputChange = (e) => {
		setTextValue(e.target.value);
		if (!e.target.value) {
			setLocationValue(
				""
			);
			setPredictions([]);
			return;
		}
		const getSuggestions = async () => {
			loader.load().then((google) => {
				let sessionToken = new google.maps.places.AutocompleteSessionToken();
				let service = new google.maps.places.AutocompleteService();
				service.getPlacePredictions(
					{
						...autocompletionRequestOptions,
						input: e.target.value,
						sessionToken: sessionToken,
					},
					(predictions, status) => {
						if (status !== google.maps.places.PlacesServiceStatus.OK) {
							console.error(status);
							return;
						}
						if (predictions.length > 0) {
							setPredictions(predictions);
						}
					}
				);
			});
		};
		getSuggestions();
	};

	const setLocationValue = (val) => {
		if (!val) {
      setTextValue("");
      onChange({
        target: {
          name,
          value: null,
          type: attribute.type,
        },
      });
      return;
    }
		
		let targetValue = null; // the value that will be sent to the server and saved in the database
		let imagenes = null;
		let selectedPrediction = predictions.find(
			(prediction) => prediction.place_id === val
		);
    
		if (selectedPrediction && selectedPrediction.place_id) {
			let country = '';
			let locality = '';
			let estado = '';
      setTextValue(selectedPrediction.description);
			loader.load().then((google) => {
				let service = new google.maps.places.PlacesService(
					document.createElement("div")
				);
				service.getDetails(
					{ placeId: selectedPrediction.place_id, fields },
					(place, status) => {
						if (status !== google.maps.places.PlacesServiceStatus.OK) {
							console.error(status);
							return;
						}
						place?.address_components.map(address => {
							const types = address.types;
							if (types.find(type => type === 'country')) {
								country = types.find(type => type === 'country') ? address.long_name : '';
							} else if (types.find(type => type === 'locality')) {
								locality = types.find(type => type === 'locality') ? address.long_name : '';
							} else if (types.find(type => type === 'natural_feature')) {
								locality = types.find(type => type === 'natural_feature') ? address.long_name : '';
							}
							else if (types.find(type => type === 'administrative_area_level_1')) {
								estado = types.find(type => type === 'administrative_area_level_1') ? address.long_name : '';
							}
						})
					
						selectedPrediction.details = place;

						targetValue = {
							description: selectedPrediction.description,
							place_id: selectedPrediction.place_id,
							details: selectedPrediction.details,
							country: country,
							locality: locality,
							estado: estado,
							data : {
								id: 1,
								attributes: {
									locality: locality,
									estado: estado,
									createdAt: "2023-09-06T18:53:48.809Z",
									updatedAt: "2023-09-06T18:53:49.586Z",
									publishedAt: "2023-09-06T18:53:49.583Z"
								},
							},
						};
												// if "photo" is in the fields array, call "getUrl()" for each photo in the response
						if (fields.includes("photo") && place?.photos) {
							Promise.all(place.photos.map(item => {
								const url = item.getUrl();
								return axios.get(url).then(res => {
									return {url: res.request.responseURL}
								})
							})).then(resultArray => {
								targetValue.details.photos = resultArray
								onChange({
									target: {
										name,
										value: JSON.stringify(targetValue),
										type: attribute.type,
									},
								});
							})
						} else {
							onChange({
								target: {
									name,
									value: targetValue,
									type: attribute.type,
								},
							});
						}
					}
				);
			});
		} else {
			// if the user is creating a new location, we don't need to call the Google Maps API
			targetValue = JSON.stringify({
				description: val,
				place_id: "custom_location",
				lat: null,
				lng: null,
			});

			onChange({
				target: {
					name,
					value: targetValue,
					type: attribute.type,
				},
			});
		}
	};

  return (
<Flex direction="column" alignItems="start" gap={3}>
			<Box width="100%">
				{loader && apiKey && fields && (
					<Combobox
						label="Location"
						name="location"
						error={error}
						required={required}
						placeholder="Busca la ubicación del servicio"
						onChange={(selection) => {
							setLocationValue(selection);
						}}
						onInputChange={(e) => handleInputChange(e)}
						value={
							(value && value !== "null") 
								? JSON.parse(value).place_id
								: ""
						}
						textValue={textValue}
						onClear={() => {
							setLocationValue(
								""
							);
						}}
					>
						{predictions
							.map((prediction) => (
								<ComboboxOption
									key={prediction.place_id}
									value={prediction.place_id}
								>
									{prediction.description}
								</ComboboxOption>
							))
							// the following lines are required to add the "custom location" options
							// without it, the combobox breaks
							.concat([
								<div
									key="custom_location"
									value="custom_location"
									style={{ display: "none" }}
								>
									{(value && value !== "null" &&
									JSON.parse(value).place_id === "custom_location")
										? JSON.parse(value).description
										: "Custom Location"}
								</div>,
							])
							.concat([
								<div
									key="selected"
									value={(value && value !== "null") ? JSON.parse(value).place_id : ""}
									style={{ display: "none" }}
								>
									{(value && value !== "null")  ? JSON.parse(value).description : ""}
								</div>,
							])}
					</Combobox>
				)}
			</Box>
		</Flex>
  )
}