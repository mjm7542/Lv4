const jwt = require("jsonwebtoken");
const { Users } = require("../models");

module.exports = async (req, res, next) => {

    const { authorization } = req.cookies; // cookie-parser
    const [tokenType, token] = (authorization ?? "").split(" "); // 널 병합 연산자 추가 
    if (tokenType !== "Bearer") {
        return res.status(403).json({ message: "로그인이 필요한 기능입니다" });
    }

    try {
        const { userId } = jwt.verify(token, "customized_secret_key");
        const user = await Users.findOne({ where: { userId } });
        res.locals.user = user;
        next();
    } catch (error) {
        res.clearCookie("authorization");
        return res.status(403).json({
            errorMessage: "전달된 쿠키에서 오류가 발생하였습니다."
        });
    }
}