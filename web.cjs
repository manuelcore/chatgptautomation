const http = require('http');
var mysql = require('mysql2');
const { parse } = require('querystring');
const prompt = require('prompt-sync')();
let question = 1;
let intrebaretxt = '';
let idintreabare = 1;
let idraspunsuri = 1;

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "secret",
    database: "sys"
});
questionid = prompt('Write question set id:');

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        collectRequestData(req, result => {
            console.log(result);
            //response recieved, process and insert into database
            var sql = "INSERT INTO `sys`.`chestionar`  (`raspunschestionar`,       `idraspunsuriq`,      `idintrebareq` ,     `useremail`,   `grade`) VALUES  ('" 
                                                    + result.raspunsurigpt + "', " + idraspunsuri + "," + idintrebare + ",'" + result.email + "','');"
            console.log(sql);
            con.query(sql, function (err, result2) {
                if (err) throw err;

            });

            res.end(`Parsed data: ${result.raspuns}`);
        });
    }
    else {

        var sql = 'SELECT * FROM sys.raspunsuri WHERE idintrebare=' + questionid + ' ORDER BY RAND() LIMIT 1;';
        console.log(sql);
        con.query(sql, function (err, result) {
            if (err) {throw err; res.end("Error! Please refresh");}
            //console.log(result);
            intrebaretxt = result[0].raspunsurigpt;
            idintreabare = result[0].idintreabare;
            idraspunsuri = result[0].idraspunsuri;
            console.log("gasit:" + result[0].raspunsurigpt);

            res.end(`
            <!doctype html>
            <html>
            <body>
                <p>`+ intrebaretxt + `</p>
                <form action="/" method="post">
                    <p>answer:</p><input type="text" name="raspunsurigpt" required/><br />
                    <p>email:</p><input type="email" name="email" required/><br />
                    <button>Send</button>
                </form>
            </body>
            </html>
        `);
        });

    }
});
server.listen(80);

function collectRequestData(request, callback) {
    const FORM_URLENCODED = 'application/x-www-form-urlencoded';
    if (request.headers['content-type'] === FORM_URLENCODED) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            callback(parse(body));
        });
    }
    else {
        callback(null);
    }
}