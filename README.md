# node-blueprint-to-postman

[![NPM](https://img.shields.io/npm/v/blueprint-to-postman.svg)](https://www.npmjs.com/package/blueprint-to-postman) [![Downloads](https://img.shields.io/npm/dt/blueprint-to-postman.svg)](https://www.npmjs.com/package/blueprint-to-postman)

Converts Blueprint API documentation to a Postman 2.1 Collection.

## Who uses it?

<table>
<tr>
<td align="center"><a href="https://crisp.chat/"><img src="https://crisp.chat/favicon-256x256.png" width="64" /></a></td>
</tr>
<tr>
<td align="center">Crisp</td>
</tr>
</table>

_👋 You use blueprint-to-postman and you want to be listed there? [Contact me](https://jamin.me/)._

## How to install?

Include `blueprint-to-postman` in your `package.json` dependencies.

Alternatively, you can run `npm install blueprint-to-postman --save`.

## How to use?

Import the module in your code:

`var MicroInvoice = require("blueprint-to-postman");`

```javascript
const BlueprintToPostman = require("blueprint-to-postman");

// Create a new instance
let blueprintToPostmanInstance = new BlueprintToPostman({
  URL_HOST: "https://example.com"
});

blueprintToPostmanInstance.convert(BLUEPRINT_EXAMPLE).then((output) => {
  console.log(output);
}).catch(e => {
  console.error(e);
})
```
