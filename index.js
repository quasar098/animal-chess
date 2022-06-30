const express = require('express');
const app = express();

// json responses?
app.use(express.json());

// public routes
app.use(express.static("public"))

// api routes
app.use("/api", require("./routes/hello"))

// open to port 5000
let port = 5000;
app.listen(process.env.PORT || port, () => {
    console.log("Listening on port " + port);
})
