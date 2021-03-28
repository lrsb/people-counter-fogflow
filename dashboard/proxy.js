const express = require('express');
const app = express();
const axios = require('axios');
const http = require('http').Server(app);
const io = require('socket.io')(http);

const BROKER_URL = 'http://localhost:8070';
//TODO: set your ip
const PROVIDING_APPLICATION = 'http://192.168.1.4:7000'

app.use(express.json());
app.post('/ngsi10/updateContext', (req, res) => {
    for (let contextElement of req.body.contextElements) {
        io.emit('message', {
            id: contextElement.id,
            next: contextElement.attributes[0].value
        })
        console.log("next location for " + contextElement.id + ": " + contextElement.attributes[0].value);
    }
    res.send({contextResponses: null})
});

io.on("connection", socket => {
    socket.on("register", data => {
        console.log('Registering EBoard.' + data.id);
        axios({
            method: 'post',
            url: BROKER_URL + '/NGSI9/registerContext',
            headers: {'fiware-service': 'openiot', 'fiware-servicepath': '/'},
            data: {
                contextRegistrations: [
                    {
                        entities: [{
                            type: 'EBoard',
                            isPattern: 'false',
                            id: 'EBoard.' + data.id
                        }],
                        attributes: [{
                            name: 'show',
                            type: 'command'
                        }],
                        providingApplication: PROVIDING_APPLICATION
                    }]
            }
        }).then(response => {
            if (response.status !== 200) {
                console.log("Error registering EBoard " + data.id);
            }
        }).catch(err => {
            console.log("Error registering EBoard " + data.id);
        });
    });
});

app.listen(7000, () => console.log("Server now running on port", 7000));
http.listen(7001, () => console.log("Socket now running on port", 7001));
