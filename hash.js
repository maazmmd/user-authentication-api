const {SHA256} = require('crypto-js');
const jwt = require('jsonwebtoken');

var data = {
    id: 9
}

let token = jwt.sign(data, 'somesecret');
console.log(token);

let decoded = jwt.verify(token, 'sdfsf');
console.log("decoded", decoded);

let string = "some string";
let hash = SHA256(string).toString();
