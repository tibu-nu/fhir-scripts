# FHIR Scripts

This repository contains scripts to import objects following the [FHIR][fhir] standard (release 4.0.1) to C2D implementation.

## Structure

The scripts are all organised in the repository root folder.

## General guidelines and requirements

The scripts only need a nodejs environment to be executed. These are the requirements:

- [nodejs][nodejs] > 14.0.0
- a .env file with the environmental variables. See the .env.template and the config/env.js files in the repository for the list of required variables.

## Scripts execution

Scripts can be executed locally. However, they need an internet connection to fetch public URLs.

### Initial set-up

Run this steps the first time and every time a new package is adedd to package.json.

1. Install node packages with [npm][npm] (or similar. Note: npm is shipped with [nodejs][nodejs]). This will create a local node_modules folder at the repository root:

   ```bash
   npm install
   ```

### Run a script

1. Copy the .env.template to .env and set the required variables.

2. Run the script:

   ```bash
   npm run <SCRIPT_NAME>
   ```

   where SCRIPT_NAME is among the ones defined in package.json "scripts" field. As new script files are added in the root folder, a new SCRIPT_NAME entry may be added (see the "scripts" field for examples).

[fhir]: http://hl7.org/fhir/
[nodejs]: https://github.com/nodejs/node
[npm]: https://github.com/npm/cli
