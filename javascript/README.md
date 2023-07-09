Demo application and library sources for JavaScript can be found here: https://github.com/ghi-electronics/due-libraries/tree/main/docs

## Running the node.js test
```
cd src
npm install
npm install -g nodemon
node index.js
```

## Running the browser test locally
Install the node.js http server. This only needs to be done once
`npn install -g http-server`

Run the server
```
cd src
http-server
```

Use the *localhost* address to access the serial port