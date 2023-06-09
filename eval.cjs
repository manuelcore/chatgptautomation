var mysql = require('mysql2');
var spawnedShell;

//helper functions
let final = 0; //used 
let idchestionar = 1;
let idintreabare = 1;
let idraspunsuriq = 1;
let raspunschestionar = '';
let raspunsurigpt = '';
//database connection
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "secret",
  database: "sys"
});

function generateEvaluation() {
  spawnedShell = require('child_process').spawn('C:\\Windows\\System32\\cmd.exe');
  //start cli
  spawnedShell.stdin.write('npm run cli\n');

  //allow the cli to initialize, then prompt
  setTimeout(function () {
    //find quiz answer + answerid and question + questionid
    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      //select fist question that has no grade
      var sql = 'SELECT C.idchestionar, C.raspunschestionar, C.idraspunsuriq, C.idintrebareq, R.raspunsurigpt  FROM chestionar C ' +
        ' INNER JOIN raspunsuri R ON C.idraspunsuriq=R.idraspunsuri ' +
        ' where C.grade="" LIMIT 1'
      con.query(sql, function (err, result) {
        if (err) throw err;
        //console.log(result);
        idchestionar = result[0].idchestionar;
        raspunschestionar = result[0].raspunschestionar;
        idintreabare = result[0].idintreabare;
        idraspunsuriq = result[0].idraspunsuriq;
        raspunsurigpt = result[0].raspunsurigpt;
        //evaluate
        let q = 'ce nota ai acorda raspunsului:"' + raspunschestionar + '" dat la intrebarea "' + raspunsurigpt + '"?\n'
        //console.log(q);
        spawnedShell.stdin.write(q);//read the question
        setTimeout(function () {
          spawnedShell.stdout.on('data', d => {
            //console.log(d.toString());
            var regex = /\d+/g;
            var percentageRegex = '\\d+(?:\\.\\d+)?%';
            //test if numeric evaluation present - search for 2 numbers, ex 5 out of 10 and use the first number
            //also test for percentage evaluation like 80% or 80.1%
            //as the answer is explaining the question it is longer the question. short answers are to be avoided!
            //if the line starts with ? it is not the line we seek

            // elimintate null, undefined,  NaN,  empty string (""), 0 or false for d and q

            if (d && q)
              if (!d.toString().startsWith("?") && d.toString().length > q.length) {
                var valueToInsert = "";
                //we take percentage first, then number
                if (d.toString().match(percentageRegex) != null) valueToInsert = d.toString().match(percentageRegex)[0].slice(0, -1);
                else if (d.toString().match(regex) != null) valueToInsert = d.toString().match(regex)[0];

                //insert evaluation (if any) into the DB

                var sqlq = 'UPDATE `sys`.`chestionar` SET `grade` = ' + valueToInsert + ' WHERE `idchestionar` = ' + idchestionar + ';';
                //console.log(sqlq);
                con.query(sqlq, function (err, res) {
                  if (err) throw err;
                  console.log("Inserted:");
                });
              }
          });
        }, 2000);

      });
    });

  }, 3000);


}

//start evaluation of the first user answer
generateEvaluation();

