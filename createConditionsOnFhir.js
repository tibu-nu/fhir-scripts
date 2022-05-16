import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import fs from 'fs';

const {
	C2D_FHIR_BASE_URL,
	C2D_AUTH_USERNAME,
	C2D_AUTH_PASSWORD,
	C2D_AUTH_CLIENT_ID,
	C2D_AUTH_URL,
	DIRNAME,
} = process.env;

/**
 * Creates Conditions on C2D following FHIR 4.0.1 standard.
 */
async function createConditionsOnFhir() {
	const conditions = [];
	const dirname = DIRNAME || 'Conditions';
	fs.readdir(dirname, function (err, filenames) {
		if (err) {
			return;
		}
		filenames.forEach(function (filename) {
			filename.includes('patched') &&
				fs.readFile(`${dirname}/${filename}`, 'utf-8', function (err, data) {
					if (err) {
						return;
					}
					conditions.push(JSON.parse(data));
				});
		});
	});

	const params = new URLSearchParams();
	params.append('username', C2D_AUTH_USERNAME);
	params.append('password', C2D_AUTH_PASSWORD);
	params.append('client_id', C2D_AUTH_CLIENT_ID);
	params.append('grant_type', 'password');

	let fetchOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params,
	};

	const resp = await fetch(`${C2D_AUTH_URL}/oauth2/token`, {
		...fetchOptions,
	});
	const result = await resp.json();
	if (result.error) {
		throw new Error();
	}
	const care2DeclareAuth = result;

	fetchOptions = {
		headers: {
			Authorization:
				care2DeclareAuth.token_type + ' ' + care2DeclareAuth.access_token,
			Accept: 'application/json; version=1',
			'Content-Type': 'application/json',
		},
	};

	for (const condition of conditions) {
		let putOptions = {
			method: 'PUT',
			headers: {
				Authorization:
					care2DeclareAuth.token_type + ' ' + care2DeclareAuth.access_token,
				Accept: 'application/fhir+json',
				'Content-Type': 'application/fhir+json',
			},
			body: JSON.stringify(condition),
		};
		if (condition.id) {
			let resp = await fetch(
				`${C2D_FHIR_BASE_URL}/${condition.subject.reference}`,
				{
					...fetchOptions,
					method: 'GET',
				},
			);
			if (resp.status === 404) {
				console.log(
					'\nPatient not Found: ',
					condition.id,
					condition.subject.reference,
				);
			} else {
				const patient = await resp.json().catch(err => {
					console.log('\nError fetching Patient!');
				});
				if (patient.id) {
					let resp = await fetch(
						`${C2D_FHIR_BASE_URL}/${condition.asserter.reference}`,
						{
							...fetchOptions,
							method: 'GET',
						},
					);
					if (resp.status === 404) {
						console.log(
							'\nPractitioner not Found: ',
							condition.id,
							condition.asserter.reference,
						);
					} else {
						const practitioner = await resp.json().catch(err => {
							console.log('\nError fetching Practitioner!');
						});
						if (practitioner.id) {
							// let resp = await fetch(
							// 	`${C2D_FHIR_BASE_URL}/Condition/${condition.id}`,
							// 	{
							// 		...fetchOptions,
							// 		method: 'GET',
							// 	},
							// );
							// if (resp.status === 404) {
							console.log('\nCreating/updating condition: ', condition.id);
							resp = await fetch(
								`${C2D_FHIR_BASE_URL}/Condition/${condition.id}`,
								putOptions,
							);
							const object = await resp.json().catch(err => {
								console.log('\nError creating Condition!');
							});
							console.log('\nResponse: ', object);
							// } else {
							// 	const object = await resp.json().catch(err => {
							// 		console.log('\nError fetching Condition!');
							// 	});
							// 	console.log('\nCondition: ', object?.id || object);
							// }
						}
					}
				}
			}
		} else {
			console.log('\nError: ', condition);
		}
	}
}

await createConditionsOnFhir();
