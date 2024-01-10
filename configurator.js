// Configurator.js created for MeshCentral-data config.json file creation. This will ask the questions to generate the file demo-config.json. simple rename of the file and running of meshcentral should garner a working server with the changes done by the scripts config.json creation.
// License: Apache2 GPL
// Creator: Mike Larios
// Date: 01/01/2024 11:45am PST

const fs = require('fs');

// Check if dependencies are installed
try {
    var axios = require('axios');
    var prompt = require('prompt-sync')();
} catch (error) {
    console.error('Dependencies not installed. Please run "npm install axios prompt-sync" and try again.');
    process.exit(1);
}

// Define the schema URL
const schemaUrl = 'https://raw.githubusercontent.com/Ylianst/MeshCentral/master/meshcentral-config-schema.json';

// Function to handle each property
function handleProperty(schema, config, property) {
    // Check if the property is an object
    if (schema.properties[property].type === 'object') {
        // Ask the user a yes/no question about including this property
        let answer = prompt(`Do you want to include ${property}? (y/n/yes/no) `).toLowerCase();

        // If the user answers 'y' or 'yes', handle each nested property
        if (answer === 'y' || answer === 'yes') {
            config[property] = {};
            for (let nestedProperty in schema.properties[property].properties) {
                handleProperty(schema.properties[property], config[property], nestedProperty);
            }
        } else if (answer === 'n' || answer === 'no') {
            // If the user answers 'n' or 'no', prefix the property with an underscore to disable it
            config['_' + property] = {};
        }
    } else {
        // Ask the user for the value of the property
        let value;
        // If the property is a boolean, convert 't', 'true', 'f', or 'false' to their boolean equivalents
        if (schema.properties[property].type === 'boolean') {
            value = prompt(`Enter a value for ${property} (t/f/true/false): `).toLowerCase();
            if (value === 't' || value === 'true') {
                value = true;
            } else if (value === 'f' || value === 'false') {
                value = false;
            }
        } else {
            value = prompt(`Enter a value for ${property}: `);
        }
        config[property] = value;
    }
}

// Fetch the schema
axios.get(schemaUrl).then(response => {
    const schema = response.data;

    // Initialize an empty config object
    let config = {};

    // Iterate over each property in the schema
    for (let property in schema.properties) {
        handleProperty(schema, config, property);
    }

    // Write the config to a file
    fs.writeFileSync('demo-config.json', JSON.stringify(config, null, 2));
    console.log('Configuration saved to demo-config.json');
}).catch(error => {
    console.error(`Failed to fetch schema: ${error}`);
});
