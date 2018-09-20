const Post =  require('../lib/mongo').Post;
const CommentModel = require('./comments')

const marked = require('marked');

Post.plugin('addCommentCount', {
    afterFind: function (posts) {
        return Promise.all(posts.map(function (post) {
            return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
                post.commentsCount = commentsCount;
                return post;
            })
        }))
    },
    afterFindOne: function (post) {
        if (post) {
            return CommentModel.getCommentsCount(post._id).then(function (count) {
                post.commentsCount = count;
                return post;
            })
        }
        return post;
    }
})
Post.plugin('contentToHtml', {
    afterFind: function (posts) {
        return posts.map(function (post) {
            post.content = marked(post.content);
            return post;
        })
    },
    afterFindOne: function (post) {
        if (post) {
            post.content = marked(post.content)
        }
        return post;
    }
})
module.exports = {
    create: function create (post) {
        return Post.create(post).exec();
    },
    getPostById: function getPostById (postId) {
        return Post
            .findOne({ _id: postId })
            .populate({ path: 'author', model: 'User' })
            .addCreatedAt()
            .addCommentCount()
            .contentToHtml()
            .exec()
    },
    getPosts: function getPosts (author) {
        const query = {};
        if (author) {
            query.author = author;
        }
        return Post
            .find(query)
            .populate({ path: 'author', model: 'User'})
            .sort({ _id: -1})
            .addCreatedAt()
            .addCommentCount()
            .contentToHtml()
            .exec()
    },
    incPv: function incv (postId) {
        return Post.update({ _id: postId}, { $inc: {pv:1}}).exec();
    },
    getRawPostById: function getRawPostById (postId) {
        return Post
            .findOne({ _id: postId })
            .populate({ path: 'author', model: 'User'})
    },
    updatePostById: function updatePostById (postId, data) {
        return Post.update({ _id: postId}, { $set: data}).exec()
    },
    delPostById: function delPostById (postId) {
        return Post.deleteOne({ _id: postId}).exec()
            .then(function (res) {
                if (res.result.ok && res.result.n > 0) {
                    return CommentModel.delCommentsByPostId(postId);
                }
            });
    }
};
