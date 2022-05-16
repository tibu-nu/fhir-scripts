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
 * Creates Practitioners on C2D following FHIR 4.0.1 standard.
 */
async function createPractitionersOnFhir() {
	const practitioners = [];
	const dirname = DIRNAME || 'Treaters';
	fs.readdir(dirname, function (err, filenames) {
		if (err) {
			return;
		}
		filenames.forEach(function (filename) {
			fs.readFile(`${dirname}/${filename}`, 'utf-8', function (err, data) {
				if (err) {
					return;
				}
				practitioners.push(JSON.parse(data));
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
			Accept: 'application/fhir+json',
			'Content-Type': 'application/fhir+json',
		},
	};

	for (const practitioner of practitioners) {
		let putOptions = {
			method: 'PUT',
			headers: {
				Authorization:
					care2DeclareAuth.token_type + ' ' + care2DeclareAuth.access_token,
				Accept: 'application/fhir+json',
				'Content-Type': 'application/fhir+json',
			},
			body: JSON.stringify(practitioner),
		};

		if (practitioner.id) {
			console.log(`Creating/Updating ${practitioner.id}`);
			let resp = await fetch(
				`${C2D_FHIR_BASE_URL}/Practitioner/${practitioner.id}`,
				putOptions,
			);
			const object = await resp.json().catch(err => {
				console.log('\nError creating Practitioner!');
			});
			console.log('\nResponse: ', object);
		} else {
			console.log('\nError: ', practitioner);
		}
	}
}

await createPractitionersOnFhir();
