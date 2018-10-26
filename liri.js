// init dotenv
require("dotenv").config();

// NPM
const keys = require("./keys");
const Spotify = require("node-spotify-api");

var spotify = new Spotify(keys.spotify);

// console.log(keys);

var action = process.argv[2];
var input = process.argv.splice(3).join(" ");

console.log(action, input);

switch (action) {
    case "concert-this":
        concertThis(action);
        break;
    case "spotify-this-song":
        spotifyThisSong(input);
        break;
    case "movie-this":
        movieThis(input);
        break;
    case "do-what-it-says":
        doIt(input);
        break;

    default:

        console.log(action + " is not a valid action.");

        break;
}

function concertThis(artist) {
    // TODO some stuff
    console.log("Get Concert");
}

function spotifyThisSong(song) {
    console.log("Spotify It");
}

function movieThis(movie) {
    console.log("Muh moovie");
}

function doIt(it) {
    console.log("Do it!");
}