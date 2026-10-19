// Render the Audio Studio welcome screen using plain JavaScript.
const app = document.getElementById("app");

const heading = document.createElement("h1");
heading.textContent = "Hello World!";

const description = document.createElement("p");
description.textContent = "Welcome to Feeless Records Audio Studio.";

app.append(heading, description);
