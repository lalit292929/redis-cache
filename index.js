const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

const generateResponse = (username, repos) => {
    return `<h2>${username} has ${repos} public repos</h2>`;
}

const getRepos = async (req, res, next) => {
    try {
        console.log("Fetching data");
        const { username } = req.params;
        console.log(username);

        // get data from api
        const repoResponse = await fetch(`https://api.github.com/users/${username}`)
        responseJson = await repoResponse.json();

        const repos = responseJson.public_repos;

        //  set data to redis 

        client.setex(username, 600, repos);

        res.send(generateResponse(username, repos));
    } catch (err) {
        console.log("Error in getRepos", err);
        res.status(500).json(err);
    }
}

// cache checker
const cache = (req, res, next) => {
    try {
        const { username } = req.params;
        client.get(username, (err, value) => {
            if (err) {
                throw err;
            }
            if (value) {
                console.log("value from cache", value);
                res.send(generateResponse(username, value));
            } else {
                next();
            }
        })
    }
    catch (err) {
        console.log("Erro in cache", err);
        next();
    }
};

app.get('/repos/:username', cache, getRepos)

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
})