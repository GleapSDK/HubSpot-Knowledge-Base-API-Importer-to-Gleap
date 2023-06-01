# HubSpot Knowledge Base API Importer for Gleap

This is a JavaScript project that fetches data from HubSpot's knowledge center articles and imports them into your Gleap project. Please note that you will need to have nodeJS installed.

## Configuration

Before running the script, you need to add the necessary information to the configuration section.

- **Gleap Token:** This is your authentication token from Gleap. You can obtain it by reading the provided documentation: https://documenter.getpostman.com/view/18586034/2s8YRiJYVC#3c381598-d1bc-42f2-9fc4-6d31bb8666df

- **Gleap Project ID:** This is your project's ID in Gleap. It can be found in the URL when you open your project in Gleap.

- **Gleap Author ID:** This is the Gleap user ID of the default author. You can obtain it by doing a GET request to https://api.gleap.io/users/me with your Gleap auth bearer.

- **Hubspot Details:** The portalId, knowledgeBaseId, and appVersion can be found from a request in the Hubspot UI. Simply open the network tab in your browser and copy the information from a request. The request you are looking for is: https://app-eu1.hubspot.com/api/knowledge-content/v1/knowledge-articles

- **Headers:** These are the authentication headers required for Hubspot.

## Running the Script

To run the script, you will need to edit all variables in the `index.js` file between `CONFIGURATION` and `CONFIGURATION END`. This will start the process of fetching the articles from Hubspot, downloading and uploading images to Gleap, and then creating the collections and articles in Gleap.

Remember to install all necessary dependencies before running the script with `npm install`.

## Dependencies

- axios
- @tiptap/extension-code-block-lowlight
- @tiptap/extension-heading
- @tiptap/extension-image
- @tiptap/extension-mention
- @tiptap/extension-text-style
- @tiptap/extension-youtube
- @tiptap/html
- @tiptap/starter-kit
- @tiptap/extension-link
- @tiptap/core
- form-data
- lowlight.js (local module)

## Disclaimer

This script is provided "as is," without any warranty or guarantee of any kind, whether expressed or implied. The APIs used in this script are subject to potential changes, and we cannot guarantee their availability or functionality.

By using this script, you do so at your own risk. We shall not be held liable for any direct, indirect, incidental, consequential, or special damages arising out of or in any way connected with the use of this script. This includes but is not limited to loss of data, profits, or business opportunities.

Please note that this script does not constitute professional advice. It is your responsibility to exercise caution and conduct your own due diligence when using this script. We recommend consulting appropriate professionals for specific advice related to your situation.

If any provision of this legal disclaimer is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.

It is strongly advised to consult with a legal professional to ensure that this legal disclaimer meets your specific requirements and is in compliance with applicable laws and regulations.

By using this script, you acknowledge that you have read, understood, and agreed to the terms and conditions outlined in this legal disclaimer.
