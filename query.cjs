const fs = require('fs');//optional, for writing results to the filesystem
var mysql = require('mysql2');
const prompt = require('prompt-sync')();
var spawnedShell;// = require('child_process').spawn('C:\\Windows\\System32\\cmd.exe');

//helper functions
let final = 0; //used 
let raspunsuri = "";
let question = "";
function startsWithNumber(str) {
  return /^\d/.test(str);
}
function returnNumber(str) {
  if (startsWithNumber(str)) {
    return Number(str.match(/^\d+/)[0]);
  }
}
//database connection
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "secret",
  database: "sys"
});


function generateQuestion() {
  spawnedShell = require('child_process').spawn('C:\\Windows\\System32\\cmd.exe');
  //start cli
  spawnedShell.stdin.write('npm run cli\n');

  //allow the cli to initialize, then prompt
  setTimeout(function () {
    //send question
    question = prompt('Type your question:');
    spawnedShell.stdin.write(question + ' aranjate ca lista\n');//read the question
    final = 1;
  }, 3000);


  //cache only the response from the console output/chat
  spawnedShell.stdout.on('data', d => {
    if (final == 1) {
      console.log(d.toString());
      if (!d.toString().startsWith("?")) {
        var result = d.toString().split(/\r?\n/);
        result.forEach(function (item) {
          if (startsWithNumber(item)) {
            raspunsuri += '->' + item;
          }
        });
        console.log('curent:' + raspunsuri);
        if (raspunsuri.length > 0) {

          //are results ok?
          if (prompt('Are results ok?(Y/N):') == 'Y') {
            //insert question
            con.connect(function (err) {
              if (err) throw err;
              console.log("Connected!");
              
              //insert the question
              var sql = 'INSERT INTO `sys`.`intrebari`  (`intrebare`)   VALUES    ("' + question + '");  '
              con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("Question inserted:" + question);
              });

              //insert the generated answers
              result.forEach(function (item) {
                if (startsWithNumber(item)) {

                  var sql = 'INSERT INTO `sys`.`raspunsuri` (raspunsurigpt,idintrebare) VALUES ("' + item + '", (SELECT id FROM intrebari WHERE intrebare="' + question + '") );';
                  //insert each item in the database 
                  con.query(sql, function (err, result) {
                    if (err) throw err;
                    console.log("ChatGPT Response inserted:" + item);
                  });

                }
              })
            });


            raspunsuri = '';
            console.log("Complete!");
            //spawnedShell.stdin.end(); // can terminate the process here
          }
          else {
            //relaunch the process here
            console.log('something went wrong, wait for prompt ...');
            raspunsuri = '';
            generateQuestion();//restart data chatGPT query
          }
        }


      }

    }
  });
}

//start data gathering
generateQuestion();

