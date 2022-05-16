import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import fs from 'fs';

const {
	C2D_FHIR_BASE_URL,
	C2D_AUTH_USERNAME,
	C2D_AUTH_PASSWORD,
	C2D_AUTH_CLIENT_ID,
	C2D_AUTH_URL,
	C2D_API_BASE_URL,
} = process.env;

/**
 * Creates Conditions on C2D following FHIR 4.0.1 standard.
 */
async function patchConditionsPatientReference() {
	const conditions = [];
	const DIRNAME = 'Conditions';
	fs.readdir(DIRNAME, function (err, filenames) {
		if (err) {
			return;
		}
		filenames.forEach(function (filename) {
			!filename.includes('patched') &&
				fs.readFile(`${DIRNAME}/${filename}`, 'utf-8', function (err, data) {
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
		let resp = await fetch(
			`${C2D_FHIR_BASE_URL}/${condition.subject.reference}`,
			{
				...fetchOptions,
				method: 'GET',
			},
		);
		if (resp.status === 404) {
			console.log(
				`\nPatient not Found: ${condition.id} ${condition.subject.reference} `,
			);
			await fetch(
				`${C2D_API_BASE_URL}/clients/${
					condition.subject.reference.split('/')[1]
				}`,
				{
					...fetchOptions,
					method: 'GET',
				},
			)
				.then(resp => resp.json())
				.then(json => {
					condition.subject.reference = `Patient/${json.resourceId}`;
					console.log(
						`Overriding condition/${condition.id} subject.reference with value ${condition.subject.reference}`,
					);
				})
				.catch(err => {
					console.log(`Error fetching Patient! ${err}`);
				});

			fs.writeFile(
				`${DIRNAME}/${condition.id}-patched.json`,
				JSON.stringify(condition),
				function (err) {
					if (err) console.log(err);
					else {
						console.log(
							`File written successfully, reference is now ${condition.subject.reference}`,
						);
					}
				},
			);
		} else {
			console.log(
				`Condition ${condition.id} has valid Patient reference ${condition.subject.reference}`,
			);
		}
	}
}

await patchConditionsPatientReference();
