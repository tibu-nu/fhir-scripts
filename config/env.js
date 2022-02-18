module.exports = {
	type: 'object',
	required: [],
	properties: {
		EXCEL_FILE_NAME: {
			type: 'string',
		},
		C2D_FHIR_BASE_URL: {
			type: 'string',
			default: 'https://fhir.c2d-demo.nl',
		},
		C2D_AUTH_USERNAME={
			type: 'string',
		},
		C2D_AUTH_PASSWORD={
			type: 'string',
		},
		C2D_AUTH_CLIENT_ID={
			type: 'string',
		},
		C2D_AUTH_URL={
			type: 'string',
		},
		DIRNAME={
			type: 'string',
		}
	},
};
