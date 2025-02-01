// Configurator.js created for "MeshCentral-data" "config.json" file creation. 
// This script generates a demo-config.json file by prompting the user for configuration values.
// Prerequisits to use this script requires NodeJS and a few modules: npm install axios prompt-sync fs
// To use the created script "demo-config.json" rename it to "config.json" and place it in the meshcentral-data directory.
// License: Apache2 GPL
// Creator: Mike Larios
// Date: 01/01/2024 11:45am PST

const fs = require('fs');
const axios = require('axios');
const prompt = require('prompt-sync')();

const schemaUrl = 'https://raw.githubusercontent.com/Ylianst/MeshCentral/master/meshcentral-config-schema.json';

async function generateConfig() {
    try {
        const response = await axios.get(schemaUrl);
        const schema = response.data;
        const config = {};

        async function handleProperty(schema, config, property) {
            const propertySchema = schema.properties[property];

            if (propertySchema.type === 'object') {
                const include = prompt(`Do you want to include ${property}? (y/n): `).toLowerCase();
                if (include === 'y') {
                    config[property] = {};
                    if (propertySchema.properties) { // Check if properties exist
                        for (const nestedProperty in propertySchema.properties) {
                            await handleProperty(propertySchema, config[property], nestedProperty);
                        }
                    }
                }
            } else {
                let value;
                let isValid = false;

                while (!isValid) {
                    const promptMessage = propertySchema.description ?
                        `${property} (${propertySchema.type}): ${propertySchema.description} (${propertySchema.default !== undefined ? `Default: ${propertySchema.default}` : ''})` : // Use !== for undefined check
                        `${property} (${propertySchema.type}): `;

                    value = prompt(promptMessage);

                    if (value === "" && propertySchema.default !== undefined) { // Use !== for undefined check
                        value = propertySchema.default;
                    }
    switch (propertySchema.type) {
                        case 'boolean':
                            if (typeof value === 'string') { // Check if value is a string before toLowerCase()
                                const lowerValue = value.toLowerCase();
                                if (lowerValue === 'true' || lowerValue === 't' || lowerValue === 'false' || lowerValue === 'f') {
                                    value = lowerValue === 'true' || lowerValue === 't';
                                    isValid = true;
                                } else {
                                    console.log("Invalid boolean value. Please enter true/t or false/f.");
                                }
                            } else if (typeof value === 'boolean') { // Handle boolean values directly
                                isValid = true;
                            } else {
                              console.log("Invalid boolean value. Please enter true/t or false/f.");
                            }
                            break;
                        case 'number':
                        case 'integer':
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                                value = numValue;
                                isValid = true;
                            } else {
                                console.log("Invalid number. Please enter a valid number.");
                            }
                            break;
                        case 'string':
                        default:
                            isValid = true;
                            break;
                    }
                }
                config[property] = value;
            }
        }

        for (const property in schema.properties) {
            await handleProperty(schema, config, property);
        }

        fs.writeFileSync('demo-config.json', JSON.stringify(config, null, 2));
        console.log('Configuration saved to demo-config.json');

    } catch (error) {
        console.error(`Failed to fetch or process schema: ${error}`);
    }
}

generateConfig();
