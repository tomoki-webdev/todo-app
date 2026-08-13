const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db;
(async () => {
    db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS todos(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text Text,
        completed INTEGER DEFAULT 0
    )
        `);
})();
const express = require("express");
const cors = require("cors");

const app = express();
const session = require('express-session');
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(cors({
    origin:"http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.get("/todo.html", (req, res, next) =>{
    if (req.session && req.session.isLoggedIn) {
        next();
    }else {
        res.redirect("/index.html");
    }
});
app.post('/update/:id', (req, res)=> {
    const targetId = req.params.id;
    const isChecked = req.body.status === '1' ? 1 : 0;
    const sql ='UPDATE todos SET completed = ? WHERE id = ?';
    db.run(sql, [isChecked, targetId], function(err)  {
        if (err) {
            console.error('データベースの更新エラー:', err);
            return res.status(500).json({ error: '更新に失敗しました'});
        }
        console.log(`データベースのID: ${targetId}を更新しました`);
        res.json({ success: true });
    });
});
app.listen(3000, ()=> {
    console.log('Sever is running!');
});
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err){
            return res.status(500).send("ログアウト失敗");
        }
        res.clearCookie('connect.sid');
        res.sendStatus(200);
});
});
app.use(express.static(__dirname));

const users=[
        {email:"test@test.com",password:"1234"}
    ];
    const todos = [
        { id: 1, text: "ラーメン", completed: false},
        { id: 2, text: "カレー", completed: false}
    ];

app.post("/login",(req,res)=>{
    const{email,password}=req.body;

     if(
     (email ==="test" &&   password === "TodoDemo-8472-Test") ||
     (email === "test2" && password === "TodoDemo-5931-Test")
     ) {
        req.session.isLoggedIn = true;
        req.session.userId = email;
        res.json({  success:true});
    }else{
        res.json({ success:false});
    }
});
app.post("/add", async (req, res) =>{
    try{
    const{ text }=req.body;
    const userId = req.session.userId;
    await db.run("INSERT INTO todos (text, completed, user_id) VALUES (?, 0, ?)",
        [text, userId]
    );
res.json({ success: true });
    } catch (err) {
        console.error( "追加エラー:", err);
        res.status(500).json({ error: err.message });
    }
});
app.get("/todos", async (req,res)=>{
    try {
 const keyword = req.query.search;
 const userId = req.session.userId;
 const allRows = await db.all("SELECT * FROM todos");
 let rows;
    if (!keyword) {
        rows = await db.all("SELECT * FROM todos WHERE user_id = ?",
            [userId]         
        );
    }else {
        rows = await db.all("SELECT * FROM todos WHERE user_id = ? AND text LIKE ?",
            [userId, `%${keyword}%`]
        );
    }
    res.json(rows);
} catch (err) {
    res.status(500).json({ error: err.message });
}
});
app.delete("/delete/:id", async (req, res) => {
    await db.run("DELETE FROM todos WHERE id = ? AND user_id = ?",
         [req.params.id, req.session.userId]
        );
    res.json({ success: true });
});
app.put("/todos/:id",async (req, res) => {
    const completedValue = req.body.completed ? 1 : 0;
    await db.run(
        "UPDATE todos SET completed = ? WHERE id = ? AND user_id = ?", 
        [completedValue, req.params.id, req.session.userId]
    );
    res.json({ success: true });
});

app.post("/register", (req, res) =>{
    const { username, password } =req.body;

    users.push({
        email: username,
        password: password
    });
    res.json({
        message: "登録成功"
    });
});
app.listen(3000,()=>{
    console.log("サーバー起動　http://localhost:3000");
});
    