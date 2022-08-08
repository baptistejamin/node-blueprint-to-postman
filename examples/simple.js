const BlueprintToPostman = require("../lib");

// Create the instance
let blueprintToPostmanInstance = new BlueprintToPostman({
  URL_HOST: "https://example.com"
});

const BLUEPRINT_EXAMPLE = `
TYPE: API Blueprint
TITLE: REST API Reference (V1)
UPDATED: 2022-07-29
FORMAT: 1A
HOST: https://api.crisp.chat/v1

# Reference

The Crisp REST API offers access and control over all Crisp data (conversations, contacts and more).

All resources that you will most likely use are prefixed with a star symbol (⭐).

**While integrating the REST API, you may be interested in the following guides:**

+ Navigation
  | Quickstart: Get started with the REST API in minutes. -> /guides/rest-api/quickstart/
  | Authentication: How to authenticate with your tokens. -> /guides/rest-api/authentication/
  | API Libraries: Libraries for your programming language. -> /guides/rest-api/api-libraries/
  | RTM API: Realtime notifications of new messages and events. -> /guides/rtm-api/

# Group Website

Manages Crisp websites.

## Base [/website]

Manages websites.

### Check If Website Exists [HEAD /website{?domain}]

Checks if given website exists (by domain).

+ Parameters
    + domain (string, required) - The website domain to check against

+ Request Check If Website Exists (application/json)

    + Tiers: \`user\` \`plugin\`

    + Body

+ Response 200 (application/json)

+ Response 404 (application/json)

### Create Website [POST /website]

Creates a new website.

+ Attributes
    + name (string, required) - Website name
    + domain (string, required) - Website domain

+ Request Create Website (application/json)

    + Tiers: \`user\`

    + Body

        \`\`\`
        {
            "name": "Acme, Inc.",
            "domain": "acme-inc.com"
        }
       \`\`\`
`;

blueprintToPostmanInstance.convert(BLUEPRINT_EXAMPLE).then((output) => {
  console.log(output);
}).catch(e => {
  console.error(e);
})