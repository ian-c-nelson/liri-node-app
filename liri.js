// add a function to String to allow replace all instances of a substring.
String.prototype.replaceAll = function (replaceStr, replaceStrWith) {
    return this.split(replaceStr).join(replaceStrWith);
}

// add a function to String to pad left
String.prototype.padLeft = function (padChar, length) {
    length = parseInt(length);
    let temp = this;

    while (temp.length < length) {
        temp = padChar + temp;
    }

    return temp;
}

// add a function to String to pad left
String.prototype.padRight = function (padChar, length) {
    length = parseInt(length);
    let temp = this;

    while (temp.length < length) {
        temp = temp + padChar;
    }

    return temp;
}


// init dotenv
require("dotenv").config();

// Other modules
const keys = require("./keys");
const Spotify = require("node-spotify-api");
const chalk = require('chalk');
const inquirer = require("inquirer");
const Rx = require("rxjs");
const fs = require("fs");
var path = require("path");
const axios = require("axios");
const moment = require('moment');

// instantiate our objects for later use.
const spotify = new Spotify(keys.spotify);
const prompts = new Rx.Subject();

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
                    nextPrompt.default = "St. Vincent"
                    prompts.next(nextPrompt);
                    break;

                case "spotify-this-song":
                    nextPrompt.message = "Input a song to get Spotify information.";
                    nextPrompt.default = "\"The Sign\" by Ace of Base"
                    prompts.next(nextPrompt);
                    break;

                case "movie-this":
                    nextPrompt.message = "Input a movie to get IMDB information.";
                    nextPrompt.default = "Mr. Nobody"
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
    error: err => log(err, "error"),
    complete: () => {
        // log the action then execute it.
        log();
        log(action + ": " + target, "text");
        doAction(action, target);
    }
});

//initiate the first question.
prompts.next({
    type: "list",
    message: "Select an action.",
    choices: ["concert-this", "movie-this", "spotify-this-song", "do-what-it-says"],
    default: "movie-this",
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
            log(action + " is not a valid action.", "error");
            break;
    }
}

// execute movie-this operation using bandsintown and axios.
function concertThis(artist) {
    let queryUrl = "https://rest.bandsintown.com/artists/" + artist.replaceAll(" ", "+") + "/events?app_id=codingbootcamp";
    axios.get(queryUrl)
        .then(({ data }) => {
            log();

            if (!data.length) {
                log("\nNo events have been found for " + artist);
            } else {
                log("Data provided by bandsintown.")
                log("\n " + data.length + " event" + (data.length !== 1 ? "s have" : " has") + " been found for " + artist);

                for (let i = 0; i < data.length; i++) {
                    log(("=== Event #: " + (i + 1) + " ").padRight("=", 100), "divider");

                    if (data[i].description) {
                        log({
                            label: " Event Name: ",
                            value: data[i].description
                        }, "value-pair");
                    }

                    if (data[i].datetime) {
                        log({
                            label: " Event Date: ",
                            value: moment(data[i].datetime).format("MM/DD/YYYY")
                        }, "value-pair");
                    }

                    if (data[i].venue) {
                        log({
                            label: "      Venue: ",
                            value: data[i].venue.name + ", " + data[i].venue.city + ", " + data[i].venue.region + ", " + data[i].venue.country
                        }, "value-pair");
                    }

                    log("".padLeft("=", 100), "divider");
                }
            }
        })
        .catch(err => log(err, "error"));
}

// execute movie-this operation using OMDB and axios.
function movieThis(movie) {
    let queryUrl = "https://www.omdbapi.com/?apikey=trilogy&t=" + movie.replaceAll(" ", "+") + "&plot=short";

    axios.get(queryUrl)
        .then(({ data }) => {
            log("Data provided by OMDB.")
            log("".padLeft("=", 100), "divider");
            if (data.Title) {
                log({
                    label: "    Movie Title: ",
                    value: data.Title
                }, "value-pair");
            }

            if (data.Released) {
                log({
                    label: "   Release Date: ",
                    value: moment(data.Released, "DD MMM YYYY").format("MM/DD/YYYY")
                }, "value-pair");
            }

            if (data.Rated) {
                log({
                    label: "          Rated: ",
                    value: data.Rated
                }, "value-pair");
            }

            if (data.Ratings) {
                data.Ratings.forEach(rating => {
                    if (rating.Source === "Rotten Tomatoes") {
                        log({
                            label: "Rotten Tomatoes: ",
                            value: rating.Value
                        }, "value-pair");
                    }
                });
            }

            if (data.Country) {
                log({
                    label: "    Produced In: ",
                    value: data.Country
                }, "value-pair");
            }

            if (data.Language) {
                log({
                    label: "       Language: ",
                    value: data.Language
                }, "value-pair");
            }

            if (data.Actors) {
                log({
                    label: "         Actors: ",
                    value: data.Actors
                }, "value-pair");
            }

            if (data.Plot) {
                log({
                    label: "           Plot: ",
                    value: data.Plot
                }, "value-pair");
            }

            log("".padLeft("=", 100), "divider");
        })
        .catch(err => log(err, "error"));


}

// execute spotify-this-song operation using node-spitify-api.
function spotifyThisSong(query) {
    // added a filter for (some) karaoke garbage.  Using quotes to make sure the order of key words is kept
    var noKaraokeQuery = ("\"" + query + "\"" + " NOT \"karaoke\"").replaceAll(" ", "%20");

    spotify.search({ type: 'track', query: noKaraokeQuery, limit: 50 }, (err, data) => {
        if (err) {
            log(err, "error");
        }

        // If more than one track is received sort descending by popularity and keep the top 5.
        let tracks = data.tracks.items;
        if (tracks.length > 1) {
            tracks = tracks.sort((a, b) => {
                return b.popularity - a.popularity;
            }).slice(0, 5);
        }

        log("Data provided by Spotify.")
        log("Note: Karaoke tracks have been filtered out to improve the quality of the results.")

        if (!data.tracks || !data.tracks.total) {
            log("\nNo tracks have been found for " + query);
        } else {
            log("\n " + data.tracks.total + " track" + (data.tracks.total !== 1 ? "s have" : " has") + " been found for " + query + ". The first 5 are listed below.");

            for (let i = 0; i < tracks.length; i++) {
                let track = tracks[i];
                let artist = track.artists[0];
                let album = track.album;

                log(("=== Track #: " + (i + 1) + " ").padRight("=", 100), "divider");

                if (track.artists[0]) {
                    log({
                        label: "   Track Name: ",
                        value: track.name
                    }, "value-pair");
                }

                if (artist) {
                    log({
                        label: "       Artist: ",
                        value: artist.name
                    }, "value-pair");
                }

                if (album) {
                    log({
                        label: "        Album: ",
                        value: album.name
                    }, "value-pair");
                }

                if (track.preview_url) {
                    log({
                        label: "  Preview Url: ",
                        value: track.preview_url
                    }, "value-pair");
                }

                if (track.popularity != undefined) {
                    log({
                        label: "   Popularity: ",
                        value: track.popularity
                    }, "value-pair");
                }

                log("".padLeft("=", 100), "divider");
            }
        }
    });
}

// read a file
function readFile(filePath, callback) {
    if (!filePath) {
        log("A file path must be provided.", "error");
    }

    if (typeof callback !== "function") {
        log("Callback must be a function.", "error");
    }

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {
            throw (err);
        }

        callback(data);
    });
}

// append to a file.
function appendToFile(filePath, text, synchronous) {
    var endOfLine = require("os").EOL;
    let fp = path.join(__dirname, filePath)
    if(synchronous) {
        fs.appendFileSync(fp, text + endOfLine, err => {});
    } else {
        fs.appendFile(fp, text + endOfLine, err => {});
    }
}

// handle different logging scenarios
function log(item, type, addLineCount) {
    item = item || "";
    type = type || "text"

    let writeLog = function(text) {
        appendToFile("log.txt", text, true);
    }

    switch (type.toLowerCase()) {
        case "value-pair":
            // parse out the item pair object and print it out in pretty chunks of roughly 100 chars in width
            let paddingWidth = item.label.length;
            let chunkLength = 100 - paddingWidth;

            if (item.value.length <= chunkLength || item.value.toString().indexOf(" ") === -1) {
                console.log(chalk.green(item.label) + chalk.cyan(item.value));
                writeLog(item.label + item.value);
            } else {
                let valChunks = [];
                let temp = temp1 = item.value;
                while (temp.length > 0) {
                    if (temp.length < chunkLength) {
                        temp1 = temp;
                    } else {
                        temp1 = temp.substr(0, chunkLength + 1);
                        temp1 = temp1.substr(0, temp1.lastIndexOf(" "));
                    }

                    valChunks.push(temp1.trim());
                    temp = temp.substr(temp1.length);
                }

                valChunks.forEach((chunk, i) => {
                    if (i === 0) {
                        console.log(chalk.green(item.label) + chalk.cyan(chunk));
                        writeLog(item.label + chunk);

                    } else {
                        var padding = "".padLeft(" ", paddingWidth);
                        console.log(padding + chalk.cyan(chunk));
                        writeLog(padding + chunk);
                    }
                });
            }
            break;
        case "error":
            console.log(chalk.red(item));
            // writeLog(item);
            break;
        case "divider":
            console.log(chalk.gray(item));
            writeLog(item);
            break;
        default:
            console.log(item);
            writeLog(item);
            break;
    }

    // if extra lines were requested log them.
    if (addLineCount) {
        for (let i = 0; i < addLineCount; i++) {
            console.log("");
            writeLog("");
        }
    }
}
