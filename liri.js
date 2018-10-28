// init dotenv
require("dotenv").config();

// Other modules
const keys = require("./keys");
const Spotify = require("node-spotify-api");
const chalk = require('chalk');
const inquirer = require("inquirer");
const Rx = require("rxjs");
const fs = require("fs");
const axios = require("axios");
const moment = require('moment');

// instantiate our objects for later use.
const spotify = new Spotify(keys.spotify);
const prompts = new Rx.Subject();
const log = console.log;

// get input from CLI using inquirer and rx
var action = "";
var target = "";

//create dynamic interface with inquirer and rx.
inquirer.prompt(prompts).ui.process.subscribe({
    next: response => {
        // if it's the 'action' question set the answer to the action variable and check to see if a second response is required.
        if (response.name === "action") {
            action = response.answer;

            // define the base question object.
            let nextPrompt = {
                type: "input",
                name: "target"
            };

            // Three actions require a second response. The fourth action 'do-what-it-says' will read the action from the ./random.txt file
            switch (response.answer) {
                case "concert-this":
                    nextPrompt.message = "Input an artist to get concert information.";
                    nextPrompt.default = "Ace of Base"
                    prompts.next(nextPrompt);
                    break;

                case "spotify-this-song":
                    nextPrompt.message = "Input a song to get Spotify information.";
                    nextPrompt.default = "The Sign by Ace of Base"
                    prompts.next(nextPrompt);
                    break;

                case "movie-this":
                    nextPrompt.message = "Input a movie to get IMDB information.";
                    nextPrompt.default = "Mr. Nobody."
                    prompts.next(nextPrompt);
                    break;

                default:
                    // no need for a further response.
                    prompts.complete();
                    break;
            }
        } else {
            // Otherwise set the answer to the target variable. No further responses will be required.
            target = response.answer;
            prompts.complete();
        }
    },
    error: err => logError(err),
    complete: () => {
        // log the action then execute it.
        logNormal("");
        logNormal(action + ": " + target, 1);
        doAction(action, target);
    },
});

//initiate the first question.
prompts.next({
    type: "list",
    message: "Select an action.",
    choices: ["concert-this", "movie-this", "spotify-this-song", "do-what-it-says"],
    default: "spotify-this-song",
    name: "action"
});

// define the action functions
function doAction(action, target) {
    switch (action) {
        case "concert-this":
            concertThis(target);
            break;

        case "spotify-this-song":
            spotifyThisSong(target);
            break;

        case "movie-this":
            movieThis(target);
            break;

        case "do-what-it-says":
            // read file and get action/input from it
            readFile("./random.txt", text => {
                // the contents of the file should be comma delimited.
                var argArray = text.split(",");

                // call this function recursively with the action/target from the file.
                doAction(argArray[0], argArray[1]);
            })
            break;

        default:
            logError(action + " is not a valid action.");
            break;
    }
}

function concertThis(artist) {
    let queryUrl = "https://rest.bandsintown.com/artists/" + artist + "/events?app_id=codingbootcamp";
    axios.get(queryUrl)
        .then(({ data }) => {
            logNormal("");

            if (!data.length) {
                logNormal("\nNo events have been found for " + artist);
            } else {
                logNormal("\n " + data.length + " event" + (data.length ? "s have" : " has") + " been found for " + artist);

                for (let i = 0; i < data.length; i++) {
                    logNormal("=== Event #: " + (i + 1) + " =====================================================");
                    if (data[i].description) {
                        logNormal(" Event Name: " + data[i].description);
                    }

                    if (data[i].datetime) {
                        logNormal(" Event Date: " + moment(data[i].datetime).format("MM/DD/YYYY"));
                    }

                    if (data[i].venue) {
                        logNormal("      Venue: " + data[i].venue.name + ", " + data[i].venue.city + ", " + data[i].venue.region + ", " + data[i].venue.country);
                    }

                    logNormal("====================================================================", 1);
                }
            }
        })
        .catch(err => logError(err));
}

function spotifyThisSong(song) {
    spotify.search({ type: 'track', query: song }, (err, data) => {
        if (err) {
            logError(err);
        }

        logNormal(data,1);
    });
}

function movieThis(movie) {
    log("Muh moovie");
}

function readFile(filePath, callback) {
    log("Read it!");

    if (!filePath) {
        logError("A file path must be provided.");
    }

    if (typeof callback !== "function") {
        logError("Callback must be a function.");
    }

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {
            throw (err);
        }

        callback(data);
    });
}

function appendToFile(filePath, text, callback) {
    log("Write it!");

    if (!filePath) {
        throw new Error("A file path must be provided.")
    }

    if (typeof callback !== "function") {
        throw new Error("Callback must be a function.")
    }

    fs.appendFile(filePath, text, err => logError(err));
}

function logError(err) {
    if (typeof err !== "string") {
        err = JSON.stringify(err, null, 2);
    }
    log(chalk.red("\nAn error has occurred:\n" + err + "\n"));
}

function logNormal(item, addLineCount) {
    if (typeof item !== "string") {
        item = JSON.stringify(item, null, 2);
    }

    log(chalk.yellow(item));

    if (addLineCount) {
        for (let i = 0; i < addLineCount; i++) {
            log("");
        }
    }
}
