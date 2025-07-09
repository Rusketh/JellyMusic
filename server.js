const Config = require("./data/config.json").server;

const { ExpressAdapter } = require('ask-sdk-express-adapter');

const Express = require('express');

const Skill = require("./skill/skill.js");

const app = Express();

const adapter = new ExpressAdapter(Skill, true, true);

app.post('/', adapter.getRequestHandlers());

app.get('/', (req, res) => { res.write("Server is running!"); res.send(); } );

app.listen(Config.port, () => console.log(`Listening on port: ${Config.port}`));