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
 * Creates an appointment on C2D following FHIR 4.0.1 standard.
 */
async function createAppointmentsOnFhir() {
	const appointments = [];
	const dirname = DIRNAME || 'Appointments';
	fs.readdir(dirname, function (err, filenames) {
		if (err) {
			console.log({ err });
			return;
		}
		filenames.forEach(function (filename) {
			fs.readFile(`${dirname}/${filename}`, 'utf-8', function (err, data) {
				if (err) {
					console.log({ err });
					return;
				}
				appointments.push(JSON.parse(data));
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

	for (const appointment of appointments) {
		let putOptions = {
			method: 'PUT',
			headers: {
				Authorization:
					care2DeclareAuth.token_type + ' ' + care2DeclareAuth.access_token,
				Accept: 'application/fhir+json',
				'Content-Type': 'application/fhir+json',
			},
			body: JSON.stringify(appointment),
		};
		if (appointment.id) {
			console.log(
				`Creating/Updating: ${C2D_FHIR_BASE_URL}/Appointment/${appointment.id}`,
			);
			let resp = await fetch(
				`${C2D_FHIR_BASE_URL}/Appointment/${appointment.id}`,
				putOptions,
			);
			const object = await resp.json().catch(err => {
				console.log('\nError creating Appointment!');
			});
			if (object?.issue) {
				console.log('\nResponse: ', object);
			}
		} else {
			console.log('\nError: ', appointment);
		}
	}
}

await createAppointmentsOnFhir();
