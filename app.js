var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/drugdb';
MongoClient.connect(url,(err, database) => {
    if (err) {
        return console.log(err);
    }
    db = database;
    http.listen(3000, function() {
        console.log('listening on 3000');
    });
});

// Result of search
var mongo_data=[];
var size = 0;
var query;              // Search Query

io.on('connection', (socket)=> {
    function get_proj_result_by_query(db, query) {
        db.collection('drugbank', function(err, col) {
            col.find({"namemain": { $regex: query }},{"namemain":1, "id":1}).toArray(function(err, docs) {
                size = docs.length;
                console.log('SIZEEE', size);
                for (var i = 0; i < docs.length; i++) {
                    console.log('doc is', docs)
                    mongo_data[i] = {
                        namemain: docs[i].namemain,
                        id: docs[i].id
                    };
                };
                // server sends the queries data to the client
                io.emit('result',mongo_data.slice(0,size));
            });
            console.log('INSD COLL', mongo_data);
        });
    };

    //listen to the client for the input data
    socket.on('submit', function(data) {
        // Close db connection if any opened.
        db.close();
        query = new RegExp( data.query + '.*', 'ig');//^ery*/i
        db.open(function(err, db) {
            var result = get_proj_result_by_query(db, query);
            if(err) { return console.dir(err); }
        });
    });
});


//render the index.html page
app.get('/', (req,res)=>{
    res.sendFile('/Users/srujansanthosh/Desktop/interview'+'/index.html',(err,data)=>{
        if (err){
            return res.end('Error loading');
            console.log('error whe sending');
        }
        res.end(data);
    });
});




// REGEX

// col.find({$or: [{"namemain": { $regex: query }},{"NamesBrand.Name": { $regex: query }},
//     {"NamesBrand.Name": { $regex: query }}]},{"namemain":1, "id":1, 'NamesBrand':1}).toArray(function(err, docs) {
//
//
// col.find({$or: [{"namemain": { $regex: query }},{"NamesBrand": {"Name": { $regex: query }}},
//     {"NamesGeneric": {"Name": { $regex: query }}}]},{"namemain":1, "id":1}).toArray(function(err, docs) {
