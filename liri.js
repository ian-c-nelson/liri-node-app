// init dotenv
require("dotenv").config();

// Other modules
const keys = require("./keys");
const Spotify = require("node-spotify-api");
const chalk = require('chalk');
const inquirer = require("inquirer");
const Rx = require("rxjs");
const fs = require("fs");

// instantiate our objects for later use.
const spotify = new Spotify(keys.spotify);
const prompts = new Rx.Subject();
const log = console.log;


// get input from CLI using inquirer and rx
let action = "";
let target = "";

//create dynamic interface with inquirer and rx.
inquirer.prompt(prompts).ui.process.subscribe({
    next: response => {


        // if it's the 'action' question set the answer to the action variable and check to see if a second response is required.
        if (response.name === "action") {
            action = response.answer;

            log(chalk.blue(response));

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
    error: err => log(chalk.red("An error has occurred: " + err)),
    complete: () => {
        log(chalk.blue({ action, target }));
        log(chalk.yellow("\nComplete"))
    },
});

//initiate the first question.
prompts.next({
    type: "list",
    message: "Select an action.",
    choices: ["concert-this", "movie-this", "spotify-this-song", "do-what-it-says"],
    default: "do-what-it-says",
    name: "action"
});



function doAction(action, input) {
    switch (action) {
        case "concert-this":
            concertThis(input);
            break;
        case "spotify-this-song":
            spotifyThisSong(input);
            break;
        case "movie-this":
            movieThis(input);
            break;
        case "do-what-it-says":

            // read file and get action/input from it

            doAction(action, target);

            break;

        default:

            log(action + " is not a valid action.");

            break;
    }

}

function concertThis(artist) {
    // TODO some stuff
    log("Get Concert");
}

function spotifyThisSong(song) {
    log("Spotify It");
}

function movieThis(movie) {
    log("Muh moovie");
}

function readFile(filePath) {
    log("Read it!");

    fs.readFile("./best_things_ever.txt", "utf8", (error, data) => {
        // Then split it by commas (to make it more readable)
        var dataArr = data.split(",");

        console.log("");
        console.log("These are the best things EVAR!")

        dataArr.forEach(thing => console.log("   " + thing.trim()))
    });
}

function appendToFile(filePath, text) {
    log("Write it!");
}