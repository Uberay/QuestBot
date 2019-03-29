const Discord = require("discord.js");
const Enmap = require("enmap");
const fs = require("fs");

const client = new Discord.Client();
const auth = require("./auth.json");
client.config = auth;

//database stuff
const SQLite = require("better-sqlite3");
const db = new SQLite('./foobar.db');

const initExchange = db.prepare(
`CREATE TABLE IF NOT EXISTS exchange(
  get INTEGER,
  give INTEGER,
  amount INTEGER
  );`
);

const initUser = db.prepare(
  `CREATE TABLE IF NOT EXISTS users(
    user INTEGER,
    positive INTEGER,
    negative INTERGER,
    total INTEGER
    );`
);

initExchange.run();
initUser.run();

const exists = db.prepare(`
SELECT * FROM users WHERE user = ?;
`);

  const insertUser = db.prepare(
  `INSERT INTO users (user,positive,negative,total) VALUES (?,0,0,0);`
);

  const insertExchange = db.prepare(
    `INSERT INTO exchange (get,give,amount) VALUES (?,?,?);`
  );

  const updateExchange = db.prepare(
    `UPDATE users SET positive = ?, negative = ?, total = ? WHERE user == ?`
  );

function give(personA,personB,amount){

    //check if personA and personB exist in users
    if(!exists.get(personA)){
      insertUser.run(personA);
    }

    if(!exists.get(personB)){
      insertUser.run(personB);
    }
      
    //add exchange to exchange table
    insertExchange.run(personA,personB,amount);

    //edit user table
    let tempA = exists.get(personA);
    let tempB = exists.get(personB);
    updateExchange.run(tempA.positive + amount, tempA.negative, tempA.total + amount, personA);
    updateExchange.run(tempB.positive, tempB.negative + amount, tempB.total - amount, personB);

}

function check(person){
    if(!exists.get(person)){
      insertUser.run(person);
    }
  return db.prepare(`SELECT * FROM users WHERE user = ?;`).get(person);
}

function history(person){
    if(!exists.get(person)){
      insertUser.run(person);
    }
  return db.prepare(`SELECT * FROM exchange WHERE get = ?;`).all(person);
}

const removeUsers = db.prepare(`
DELETE from users
`);

const removeExchange = db.prepare(`
DELETE from exchange
`);



client.on('ready',() =>{
   //initialize the databases
    //removeAll.run(); 
    console.log("ready to roll!");
    
});

client.on('message',(msg)=>{
    //do something when someone sends a message
  
    let message = msg.content;
    if(msg.author.bot) return;
    
    if(message.charAt(0) == "$"){
        let temp = message.substr(1).split(" ");
        let command = temp[0];
        let args = temp.splice(1);
        args = args.filter(n => n);
        
        if(command == "pay"){
            if (parseInt(args[1]) < 0 || !Number.isInteger(parseInt(args[1]))){
                msg.reply("Invalid Krunkies!");
                return;
            }
            give(parseInt(args[0].replace(/[^0-9]/g,'')),parseInt(msg.author.id),parseInt(args[1]));
            msg.reply(`You have successfully paid **${parseInt(args[1])}** krunkies`);
        }
        
        if(command == "check"){
            let temp = (check(parseInt(args[0].replace(/[^0-9]/g,''))));
            msg.channel.send(`Positive: **${temp.positive}**  Negative: **${temp.negative}**  Total: **${temp.total}**`);
        }
        
        if(command == "history"){
            let temp = (history(parseInt(args[0].replace(/[^0-9]/g,''))));
            msg.channel.send(JSON.stringify(temp));
        }
        
        if(command == "erase"){
            if(parseInt(msg.author.id) == 386728804539957250){
                removeUsers.run();  
                removeExchange.run();
                msg.channel.send("Erase Authorized");
            } else {
                msg.channel.send("You do not have the perms!");
            }
        }
        
        if(command == "help"){
            msg.channel.send("**This bot allows you to send Krunkie IOU's**");
            msg.channel.send("...");
            msg.channel.send(`$pay [user] [amount]
$check [user]
$history [user]`);
            
        }
//        console.log(`the command is ${command} and the args is ${args}`);
//        console.log(message);
    }
});




client.login(client.config.token);