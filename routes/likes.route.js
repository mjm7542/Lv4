const express = require("express");
const { Likes } = require("../models");
const { Posts } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("sequelize")
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

// 좋아요 게시물 조회
router.get('/likes', authMiddleware, async (req, res) => {
    try {
        const { userId } = res.locals.user;

        const postIdArray = await Likes.findAll({
            attributes: ['PostId'],
            where: {
                UserId: userId
            }
        });
        const postIdList = postIdArray.map((like) => like.PostId);

        const result = await Posts.findAll({
            attributes: [
                'postId',
                'UserId',
                'nickname',
                'title',
                [sequelize.fn('COUNT', sequelize.col('Likes.PostId')), 'like']
            ],
            include: [
                {
                    model: Likes,
                    attributes: []
                }
            ],
            where: {
                postId: {
                    [sequelize.Op.or]: postIdList
                }
            },
            group: ['Posts.postId'],
            order: [[sequelize.fn('COUNT', sequelize.col('Likes.PostId')), 'DESC']],
            raw: true
        });


        res.status(200).json({ result: result })
    } catch (err) {
        console.error(err);
        return res
            .status(400)
            .json({ errorMessage: "좋아요 게시글 조회에 실패하였습니다." });
    }
});

// 게시글 좋아요
router.put('/:postId/likes', authMiddleware, async (req, res) => {
    try {
        const { userId } = res.locals.user;
        const { postId } = req.params;

        const post = Posts.findOne({ where: { postId } })
        if (!post) {
            return res
                .status(404)
                .json({ errorMessage: "게시글이 존재하지 않습니다." });
        }
        const likes = await Likes.findOne({
            where: {
                [Op.and]: [{ UserId: userId }, [{ PostId: postId }]]
            }
        }
        );
        if (!likes) {
            await Likes.create({ UserId: userId, PostId: postId });
            return res
                .status(200)
                .json({ Message: "게시글의 좋아요를 등록하였습니다." });
        } else {
            await Likes.destroy({
                where: {
                    [Op.and]: [{ UserId: userId }, [{ PostId: postId }]]
                }
            })
            return res
                .status(200)
                .json({ Message: "게시글의 좋아요를 취소하였습니다." });
        }
    } catch (err) {
        console.error(err);
        return res
            .status(400)
            .json({ errorMessage: "게시글 좋아요에 실패하였습니다." });
    }
});

module.exports = router;