var WebSocketServer = require("ws").Server;
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
        .use(function(req, res){
            res.sendFile(INDEX)
        });

var wss = new WebSocketServer(server);
var id = 0;
var historique = [];
var whiteBoardHistorique = [];

require('cmds.js')();

console.log("Server started...");

function broadcast(data) {
    data1 = JSON.parse(data);
    var msg = "";
    wss.clients.forEach(function each(client) {
        msg = '{"type":"' + data1.type + '", "id":' + data1.id + ', "who":"' + data1.who + '", "text":"' + data1.text + '", "date":' + Date.now() + '}';
        try {
            client.send(data);
        }
        catch (error) {
            console.log(error);
            if (error == 'Error: not opened') {
                wss.removeClient(null, client.name) ;
            }
        }
    });
    if(data1.type == "message")
        historique.push(msg);
    else if(data1.type == "wBL")
        whiteBoardHistorique.push(msg);
};

wss.on('connection', function (ws) {
    console.log("Browser connected online...")
    ws.send('{"type":"id", "id":' + id + '}');
    ws.send('{"type":"message", "who":"server", "text":"Bienvenu !!!"}');
    sendHistorique(ws);

    id++;

    ws.on("message", function (str) {
        var msg = JSON.parse(str);
        treatMessage(str);
    })

    ws.on("close", function() {
        console.log("Browser gone.")
    })
});

function treatMessage(pMsg){
    var ret = "";
    var mMsg = JSON.parse(pMsg);
    if(mMsg.type == "message"){
        broadcast(pMsg);
        if(mMsg.text.substring(0,1) == "!"){
            if(mMsg.text.substring(1) == "UpdateCmds"){
                console.log("mise a jour");
                delete require.cache[require.resolve('cmds.js')];
                require('cmds.js')();
            }
            else{
                console.log(mMsg.text.substring(1));
                ret = treat(mMsg.text.substring(1));
            }

            if(ret == "cls")
                historique = [];
            else if(ret != "")
                broadcast(ret);
        }
    }
    else if(mMsg.type == "connection"){
        ret = '{"type":"message", "who":"server", "text":"' + mMsg.who + ' est rentré dans le chat !", "id":-1, "date":' + Date.now() + '}';
        broadcast(ret);
    }
    else if(mMsg.type == "wBL"){
        ret = '{"type":"wBL", "who":"' + mMsg.who + '", "text":"' + mMsg.text + '", "id":' + mMsg.id + ', "date":' + Date.now() + '}';
        broadcast(ret);
    }
}

function sendHistorique(ws){
    historique.forEach(
        function a(b){ws.send(b);}
    );
}