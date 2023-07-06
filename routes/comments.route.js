const express = require("express");
const { Users, Posts, Comments } = require("../models");
const authMiddleware = require("../middlewares/auth-middleware");
const sequelize = require("sequelize")
const router = express.Router();

//? 댓글 조회 
router.get("/:postId/comments", async (req, res) => {
    try {
        const { postId } = req.params;
        //! 게시글이 존재하지 않을 때
        const posts = await Posts.findOne({ where: { PostId: postId } })
        if (!posts) {
            return res
                .status(404)
                .json({ errorMessage: "게시글이 존재하지 않습니다." });
        }

        const comments = await Comments.findAll({
            where: { PostId: postId },
            attributes: [
                'commentId',
                'UserId',
                'comment',
                'createdAt',
                'updatedAt',
            ],
            include: [{
                model: Users,
                attributes: ['nickname']
            }],
            group: ['commentId'],
            raw: true
        });
        // 이건 map()로 출력 다른 방법으론 comment 생성 시 닉네임을 같이 저장(게시글)
        const newComments = comments.map((comment) => {
            return {
                commentId: comment.commentId,
                UserId: comment.UserId,
                nickname: comment['User.nickname'],
                comment: comment.comment,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }
        })
        res.status(200).json({ comments: newComments });
    } catch (err) {
        console.error(err);
        return res
            .status(400)
            .json({ errorMessage: "댓글 조회에 실패하였습니다." });
    }
});

//? 댓글 생성
router.post("/:postId/comments", authMiddleware, async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = res.locals.user;
        //! body에 문제가 있을 때
        const { comment } = req.body;
        if (Object.keys(req.body).length === 0)
            return res
                .status(412)
                .json({ message: "데이터 형식이 올바르지 않습니다" });
        //! 게시물 못 찾을 때 에러
        const posts = await Posts.findOne({ where: { postid: postId } })
        if (!posts) {
            return res
                .status(404)
                .json({ errorMessage: "게시글이 존재하지 않습니다." });
        }
        await Comments.create({
            UserId: userId,
            PostId: postId,
            comment: comment
        });
        return res.status(201).json({ message: "댓글을 작성하였습니다." });
    } catch (err) {
        console.error(err)
        return res
            .status(400)
            .json({ errorMessage: "댓글 작성에 실패하였습니다." });
    }
});

//? 댓글 수정
router.put("/:postId/comments/:commentId", authMiddleware, async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { comment } = req.body;
        const { userId } = res.locals.user;
        //! body에 문제가 있을 때
        if (Object.keys(req.body).length === 0) {
            return res
                .status(412)
                .json({ errorMessage: "데이터 형식이 올바르지 않습니다." })
        }
        //! 게시물 못 찾을 때 에러
        const posts = await Posts.findOne({ where: { postId: postId } })
        if (!posts) {
            return res
                .status(404)
                .json({ errorMessage: "게시글이 존재하지 않습니다." });
        }
        //! 댓글을 못 찾을 때 에러
        const comments = await Comments.findOne({ where: { commentId: commentId } })
        if (!comments) {
            return res
                .status(404)
                .json({ errorMessage: "댓글이 존재하지 않습니다." });
        }
        //! 권한이 없을 때 (토큰의 닉네임 활용)
        if (comments.UserId !== userId) {
            return res
                .status(403)
                .json({ errorMessage: "댓글의 수정 권한이 존재하지 않습니다." });
        }

        const updateCommentStatus = await Comments.update(
            { comment },
            { where: { commentId } }
        );

        //! acknowledged 정상적 처리 확인 
        if (updateCommentStatus) {
            return res.status(200).json({ message: "댓글을 수정하였습니다" }); // 상태코드 수정 201 -> 204
        } else {
            return res
                .status(400)
                .json({ errorMessage: "댓글 수정이 정상적으로 처리되지 않았습니다." });
        }

    } catch (err) {
        console.error(err)
        res
            .status(400)
            .json({ errorMessage: "댓글 수정에 실패하였습니다." });
    }
});
//? 댓글 삭제
router.delete("/:postId/comments/:commentId", authMiddleware, async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { userId } = res.locals.user;

        //! 게시물 못 찾을 때 에러
        const posts = await Posts.findOne({ where: { postId: postId } })
        if (!posts) {
            return res
                .status(404)
                .json({ errorMessage: "게시글이 존재하지 않습니다." });
        }
        //! 댓글을 못 찾을 때 에러
        const comments = await Comments.findOne({ where: { commentId: commentId } })
        if (!comments) {
            return res
                .status(404)
                .json({ errorMessage: "댓글이 존재하지 않습니다." });
        }
        //! 권한이 없을 때 (토큰의 닉네임 활용)
        if (comments.UserId !== userId) {
            return res
                .status(403)
                .json({ errorMessage: "댓글의 삭제 권한이 존재하지 않습니다." });
        }

        const deleteCommentStatus = await Comments.destroy(
            { where: { commentId } }
        );

        //! acknowledged 정상적 처리 확인 
        if (deleteCommentStatus) {
            return res.status(200).json({ message: "댓글을 삭제하였습니다" }); // 상태코드 수정 201 -> 204
        } else {
            return res
                .status(400)
                .json({ errorMessage: "댓글 삭제가 정상적으로 처리되지 않았습니다." });
        }

    } catch (err) {
        console.error(err)
        res
            .status(400)
            .json({ errorMessage: "댓글 삭제에 실패하였습니다." });
    }
});

module.exports = router;