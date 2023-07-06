const express = require("express");
const cookieParser = require("cookie-parser");
const indexRouter = require("./routes/index.route");
const app = express();
const PORT = 3024;

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("이제 왜 됨?");
});

app.use('/api', indexRouter);

app.listen(PORT, () => {
    console.log(PORT, '포트 번호로 서버가 실행되었습니다.');
})
