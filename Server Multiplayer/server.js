var app = require('http').createServer(handler)
var io = require('socket.io')(app);
app.listen(333);
function handler(req, res) {
    res.writeHead(200);
    return res.end('Made By GooD');
}
var Users = {};

io.on('connection', function (client) {
    client.emit("ID", client.id);
    client.on('Ping', function () {
    });
    client.on('disconnect', function () {
        if (Users[client.id]["Opponent"] != null) {
            Users[Users[client.id]["Opponent"]]["Opponent"] = null;
            Users[Users[client.id]["Opponent"]]["Status"] = true;
            io.sockets.connected[Users[client.id]["Opponent"]].emit("Left");
        }

        delete Users[client.id];
        io.emit("Update", Users);
    });
    client.on('setName', function (data) {
        var Details = {};
        Details["ID"] = client.id;
        Details["Name"] = data;
        Details["Score"] = 0;
        Details["Rank"] = Object.keys(Users).length + 1;
        Details["Status"] = true;
        Details["Opponent"] = null;
        Users[client.id] = Details;
        io.emit('Update', Users);
    });
    client.on('NewGame', function () {
        Users[client.id]["Opponent"] = null;
        Users[client.id]["Status"] = true;
        io.emit('Update', Users);
    });
    client.on('Reject', function () {
        io.sockets.connected[Users[client.id]["Opponent"]].emit("Reject", "Your request was rejected by " + Users[client.id]["Name"] + ".");
        Users[Users[client.id]["Opponent"]]["Status"] = true;
        Users[client.id]["Opponent"] = null;
        Users[client.id]["Status"] = true;
        io.emit('Update', Users);
    });
    client.on('SendDraw', function () {
        io.sockets.connected[Users[client.id]["Opponent"]].emit("Draw");
        io.sockets.connected[client.id].emit("Draw");
    });
    client.on('ChangeTurn', function () {

        io.sockets.connected[Users[client.id]["Opponent"]].emit("Turn");
    });
    client.on("ChangeButton", function (data) {
        io.sockets.connected[Users[client.id]["Opponent"]].emit("Change", data);
    });
    client.on('SendWinner', function () {
        io.sockets.connected[Users[client.id]["Opponent"]].emit("Winner");
        Users[client.id]["Score"] += 1;
        io.emit('Update', Users);
    });
    client.on('Accept', function () {
        var Xor0 = Math.round(Math.random(0, 1));
        console.log(Xor0);
        var Data = {};
        if (Xor0 == 0) {
            Data["First"] = Users[client.id]["Name"];
            Data["Xor0"] = "X";
            Data["Second"] = "O";
        }
        else if (Xor0 == 1) {
            Data["First"] = Users[Users[client.id]["Opponent"]]["Name"];
            Data["Xor0"] = "O";
            Data["Second"] = "X";
        }
        io.sockets.connected[Users[client.id]["Opponent"]].emit("StartGame", Data);
        io.sockets.connected[client.id].emit("StartGame", Data);
        console.clear();
        console.log(Users);
        io.emit('Update', Users);
    });
    client.on('Invite', function (id) {
        if (id == client.id) {
            io.sockets.connected[client.id].emit('Message', "You cannot play yourself.");
        }
        else {
            if (Users[id]["Status"] == true && Users[client.id]["Status"] == true) {
                io.sockets.connected[id].emit("InviteLobby", "Do you want to play with " + Users[client.id]["Name"] + "?");
                Users[client.id]["Status"] = false;
                Users[id]["Status"] = false;
                Users[id]["Opponent"] = client.id;
                Users[client.id]["Opponent"] = id;
            }
            else
                io.sockets.connected[client.id].emit('Message', Users[id]["Name"] + " is in other game.");
        }
    });
});
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});