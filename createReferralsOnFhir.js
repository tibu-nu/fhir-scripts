import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import fs from 'fs';

const {
	C2D_FHIR_BASE_URL,
	C2D_AUTH_USERNAME,
	C2D_AUTH_PASSWORD,
	C2D_AUTH_CLIENT_ID,
	C2D_AUTH_URL,
} = process.env;

/**
 * Creates Referrals on C2D following FHIR 4.0.1 standard.
 */
async function createReferralsOnFhir() {
	const referrals = [];
	fs.readdir(DIRNAME, function (err, filenames) {
		if (err) {
			return;
		}
		filenames.forEach(function (filename) {
			fs.readFile(`${DIRNAME}/${filename}`, 'utf-8', function (err, data) {
				if (err) {
					return;
				}
				referrals.push(JSON.parse(data));
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

	for (const referral of referrals) {
		let putOptions = {
			method: 'PUT',
			headers: {
				Authorization:
					care2DeclareAuth.token_type + ' ' + care2DeclareAuth.access_token,
				Accept: 'application/fhir+json',
				'Content-Type': 'application/fhir+json',
			},
			body: JSON.stringify(referral),
		};

		if (referral.id) {
			let resp = await fetch(
				`${C2D_FHIR_BASE_URL}/${referral.subject.reference}`,
				{
					...fetchOptions,
					method: 'GET',
				},
			);
			if (resp.status === 404) {
				console.log(
					'\nPatient not Found: ',
					referral.id,
					referral.subject.reference,
				);
			} else {
				const patient = await resp.json().catch(err => {
					console.log('\nError fetching Patient!');
				});
				if (patient.id) {
					let resp = await fetch(
						`${C2D_FHIR_BASE_URL}/ReferralRequest/${referral.id}`,
						{
							...fetchOptions,
							method: 'GET',
						},
					);
					if (resp.status === 404) {
						console.log('\nNot Found: ', referral.id);
						resp = await fetch(
							`${C2D_FHIR_BASE_URL}/ReferralRequest/${referral.id}`,
							putOptions,
						);
						const object = await resp.json().catch(err => {
							console.log('\nError creating Referral!');
						});
						console.log('\nResponse: ', object);
					} else {
						const object = await resp.json().catch(err => {
							console.log('\nError fetching Referral!');
						});
						console.log('\nReferral: ', object?.id || object);
					}
				}
			}
		} else {
			console.log('\nError: ', referral);
		}
	}
}

await createReferralsOnFhir();
