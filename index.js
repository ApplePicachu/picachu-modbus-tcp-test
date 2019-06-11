var net = require('net');
var modbus = require('modbus-tcp');
var modbusServer = new modbus.Server();
var modbusClient = new modbus.Client();

var registerValue = {'6001': 110, '6002': 83, '6003': 101, '6004': 100, '6005': 99, '6006': 97, '6009': 77, '6010': 74, '6011': 87, '6012': 114, '6013': 528, '6014': 0, '6015': 0, '6016': 0, '6017': 434, '6018': 0, '6019': 302, '6020': 0, '6021': 436}
var coilValue = {'2001': 1, '2002': 1};

const port = 502;

var tcpServer = net.createServer();

tcpServer.listen(port, function () {
    console.log('TCP Socket bound to port ' + port);
});

tcpServer.on('connection', function (socket) {
    console.log('client has connected');
    modbusServer.pipe(socket);

    socket.on('error', function (e) {
        console.log('Connection error: ' + e);
        socket.destroy();
    });

    socket.on('close', function (e) {
        console.log('Client has closed connection.');
    });
});

modbusServer.on('read-coils', readCoils);
modbusServer.on('read-discrete-inputs', readCoils);
modbusServer.on('read-holding-registers', readHoldingRegisters);
modbusServer.on('read-input-registers', readHoldingRegisters);

modbusServer.on('write-single-coil', writeSingleCoil);
modbusServer.on('write-single-register', writeSingleRegister);
modbusServer.on('write-multiple-coils', writMultipleCoils);
modbusServer.on('write-multiple-registers', writeMultipleRegisters);

function readHoldingRegisters(from, to, reply) {
    console.log('Read holding registers ' + from + '-' + to);
    var currentTime = new Date();
    const num = Math.round((currentTime.getTime() % 60000) / 100) * 100;
    var values = new Array(to - from + 1).fill(0);
    // for (var i = 0; i < (to - from + 1); i++) {
    //     // console.log(i + " " + (num + ((from + i + 1) % 100)));
    //     values[i] = num + ((from + i + 1) % 100);
    // }
    // console.log(JSON.stringify(values));
    for(var i = from; i <= to; i++){
        if(registerValue[i])values[i-from] = registerValue[i];
    }
    return reply(null, bufferify(values));
}

function readCoils(from, to, reply) {
    console.log('Read coils ' + from + '-' + to);
    var values = new Array(to - from + 1).fill(0); // anything greater than zero is received as a 1
    // values.fill(0, 0, values.length);//(value, start, end)
    // for (var i = (from % 2); i < values.length; i += 2) {
    //     values[i] = 1;
    // }
    // console.log(JSON.stringify(values));
    for(var i = from; i <= to; i++){
        if(coilValue[i])values[i-from] = coilValue[i];
    }
    return reply(null, values);
}

function writeSingleCoil(addr, item, reply) {
    console.log('Write single coil ' + addr);
    // console.log('item:'+JSON.stringify(item));
    var value = Buffer.from(item).readUInt16BE();
    coilValue[addr.toString(10)] = value>0?true:false;
    // console.log(JSON.stringify(coilValue));
    reply();
}
function writeSingleRegister(addr, item, reply) {
    console.log('Write single register ' + addr);
    // console.log('item:'+JSON.stringify(item));
    var value = Buffer.from(item).readUInt16BE();
    registerValue[addr.toString(10)] = value;
    // console.log(JSON.stringify(registerValue));
    reply();
}
function writMultipleCoils(from, to, items, reply) {
    console.log('Write multiple coils ' + from + '-' + to);
    // console.log('items:'+items);
    if(items.length == (to-from+1)){
        for(var i = 0; i < items.length ; i++){
            coilValue[(i+from).toString(10)] = items[i]?true:false;
        }
    }
    // console.log(JSON.stringify(coilValue));
    reply();
}
function writeMultipleRegisters(from, to, items, reply) {
    console.log('Write multiple registers ' + from + '-' + to);
    // console.log('items:'+JSON.stringify(items));
    var dataArray = unbufferify(items);
    // console.log(JSON.stringify(dataArray));
    if(dataArray.length == (to-from+1)){
        for(var i = 0; i < dataArray.length ; i++){
            registerValue[(i+from).toString(10)] = dataArray[i];
        }
    }
    // console.log(JSON.stringify(registerValue));
    reply();
}

function bufferify(itemsArray) {
    // When client reads values, have to supply an 
    // array of Buffers (not just an array of numbers) to the reply function.
    var n = itemsArray.length;
    var registers = [];
    for (var i = 0; i < n; i++) {
        registers[i] = Buffer.alloc(2);
        registers[i].writeUInt16BE(itemsArray[i], 0);
    }
    return registers;
}

function unbufferify(bufferArray) {
    var n = bufferArray.length;
    var registers = [];
    for (var i = 0; i < n; i++) {
        registers[i] = Buffer.from(bufferArray[i]).readUInt16BE();
    }
    return registers;
}