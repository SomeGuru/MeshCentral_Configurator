// Configurator.js created for MeshCentral-data config.json file creation. 
// This script generates a demo-config.json file by prompting the user for configuration values.
// Prerequisites to use this script requires NodeJS and a few modules: npm install axios prompt-sync fs
// Rename demo-config.json to config.json and place it in the MeshCentral data directory.
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
                    if (propertySchema.properties) {
                        for (const nestedProperty in propertySchema.properties) {
                            await handleProperty(propertySchema, config[property], nestedProperty);
                        }
                    }
                }
            } else {
                let value;
                let isValid = false;

                while (!isValid) {
                    let promptMessage = `${property} (${propertySchema.type}): `;
                    if (propertySchema.description) {
                        promptMessage += `${propertySchema.description} `;
                    }

                    if (propertySchema.enum) {
                        promptMessage += `(Options: ${propertySchema.enum.join(', ')}) `;
                    } else if (propertySchema.type === 'boolean') {
                        promptMessage += "(t/f/true/false) ";
                    } else if (propertySchema.examples) {
                        promptMessage += `(Examples: ${propertySchema.examples.join(', ')}) `;
                    }

                    if (propertySchema.default !== undefined) {
                        promptMessage += `(Default: ${propertySchema.default})`
                    }

                    value = prompt(promptMessage);

                    if (value === "" && propertySchema.default !== undefined) {
                        value = propertySchema.default;
                    }

                    switch (propertySchema.type) {
                        case 'boolean':
                            if (typeof value === 'string') {
                                const lowerValue = value.toLowerCase();
                                if (lowerValue === 'true' || lowerValue === 't' || lowerValue === 'false' || lowerValue === 'f') {
                                    value = lowerValue === 'true' || lowerValue === 't';
                                    isValid = true;
                                } else {
                                    console.log("Invalid boolean value. Please enter true/t or false/f.");
                                }
                            } else if (typeof value === 'boolean') {
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

                // *** This is the crucial part, ONLY ONE handleProperty function ***
                if (value !== null && value !== undefined && value !== "") {
                    config[property] = value;
                } else if (propertySchema.required && !config[property]) {
                  config[property] = null;
                }
            }
        }

        for (const property in schema.properties) {
            await handleProperty(schema, config, property); // Call the correct, single function
        }

        fs.writeFileSync('demo-config.json', JSON.stringify(config, null, 2));
        console.log('Configuration saved to demo-config.json');

    } catch (error) {
        console.error(`Failed to fetch or process schema: ${error}`);
    }
}

generateConfig();
