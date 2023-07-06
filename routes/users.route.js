const express = require("express");
const { Users } = require("../models");
const jwt = require("jsonwebtoken");
const router = express.Router();

// 회원가입
router.post("/signup", async (req, res) => {
    const { nickname, password, confirm } = req.body;
    const regex = /[^a-zA-Z0-9]/g;
    try {

        if (!nickname || !password || !confirm) {
            return res.status(400).json({ errorMessage: "항목을 모두 적으세요" });
        }
        //! body data가 잘못된 경우
        if (!nickname || !password) {
            return res
                .status(400)
                .json({ errorMessage: "닉네임 또는 비밀번호를 입력하지 않았습니다" });
        }
        //! 닉네임 형식이 비정상적인 경우
        if (nickname.length < 3 || nickname.search(regex) !== -1) {
            return res
                .status(412)
                .json({ errorMessage: "닉네임의 형식이 일치하지 않습니다." });
        }
        //! 패스워드 형식이 비정상적인 경우
        if (password.length < 4) {
            return res
                .status(412)
                .json({ errorMessage: "패스워드 형식이 일치하지 않습니다." });
        }
        //! 패스워드에 닉네임이 포함되어 있는지 여부
        if (password.includes(nickname)) {
            return res
                .status(412)
                .json({ errorMessage: "패스워드에 닉네임이 포함되어 있습니다." });
        }
        //! 패스워드 일치 확인
        if (password !== confirm) {
            return res
                .status(412)
                .json({ errorMessage: "패스워드가 일치하지 않습니다." });
        }
        //! 닉네임 중복 확인
        const user = await Users.findOne({ where: { nickname } });
        if (user)
            return res.status(412).json({ errorMessage: "중복된 닉네임입니다." });

        //* 회원가입 성공 
        await Users.create({ nickname, password });
        return res.status(201).json({ message: "회원가입이 완료되었습니다." });

    } catch (err) {
        console.error(err);
        return res
            .status(400)
            .json({ errorMessage: "요청한 데이터 형식이 올바르지 않습니다." });
    }
});

// 로그인
router.post("/login", async (req, res) => {
    try {
        const { nickname, password } = req.body;
        const user = await Users.findOne({ where: { nickname } });

        //! 닉네임 혹은 패스워드 불일치
        if (!user || password !== user.password) {
            res.status(412).json({
                errorMessage: "닉네임 또는 패스워드를 확인해주세요.",
            });
            return;
        }

        // JWT 생성
        const token = jwt.sign(
            { userId: user.userId, nickname: user.nickname },
            "customized_secret_key"
        );

        res.cookie("authorization", "Bearer " + token);
        res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            errorMessage: "로그인에 실패하였습니다.",
        });
    }
});


module.exports = router;