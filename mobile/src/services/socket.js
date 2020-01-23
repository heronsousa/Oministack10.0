import socketio from 'socket.io-client';

const socket = socketio('http://192.168.15.22:3333', {
    autoConnect: false
});

function subscribeNewDevs(subscribeFunction) {
    socket.on('newDevs', subscribeFunction);
}

function connect(latitude, longitude, techs){
    socket.io.opts.query = { latitude, longitude, techs };

    socket.connect();
}

function disconnect(){
    if(socket.connected){
        socket.disconnect();
    }
}

export {
    connect,
    disconnect,
    subscribeNewDevs
};