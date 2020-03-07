const {responseMessages} = require('../../../config/config');
const {
  saveNewPicture,
  getPosts,
  saveNewPost,
  saveNewTag,
  getTags,
} = require('./Post.model');
const {logger} = require('../../../config/config');

exports.newPostController = async (req, res, next) => {
  try {
    const {
      picture,
      caption,
    } = req.body;

    let {tags} = req.body;

    const {
      email: userEmail,
    } = req.user;

    if (!picture) {
      req.error = {
        status: 400,
        message: responseMessages[400],
        logger: 'picture not defined'
      };
      return next(new Error());
    } else if (!picture.fullUrl || !picture.shortName) {
      req.error = {
        status: 400,
        message: responseMessages[400],
        logger: 'fullUrl or providerName or shortName not defined in picture object'
      };
      return next(new Error());
    }
    const {pictureId} = await saveNewPicture({
      fullUrl: picture.fullUrl,
      providerName: picture.providerName,
      shortName: picture.shortName,
    });

    tags = await Promise.all(
      tags.map(async tag => {
        if (tag.isNew || !tag.tagId) {
          let tagDetails;
          tagDetails = await saveNewTag({tag: tag.tag});
          return tagDetails.tagId;
        } else {
          return tag.tagId;
        }
      }),
    );
    await saveNewPost({
      caption,
      tags,
      pictureId,
      userEmail,
    });
    logger.info(`[Post.controller.js] New Post created, request Id - ${req.request.callId}`);
  } catch (e) {
    next(e);
  }
};

exports.getPostsController = async (req, res, next) => {
  try {
    const {email} = req.user;
    const response = await getPosts(email);
    res.status(200).json({
      status: 200,
      message: responseMessages[200],
      data: {
        totalPosts: response.total,
        posts: response.posts,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.getTagsController = async (req, res, next) => {
  try {
    const {
      q: searchQuery,
    } = req.query;
    const tags = await getTags(searchQuery);
    res.status(200).json({
      status: 200,
      message: responseMessages[200],
      data: {
        tags,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.saveNewTagsController = async (req, res, next) => {
  try {
    const {tags} = req.body;
    if (!tags || tags.length === 0 || (tags && !Array.isArray(tags))) {
      req.error = {
        status: 400,
        message: responseMessages[400],
      };
      return next(new Error());
    }
    console.log('tag', tags);
    for (let tag of tags) {
      await saveNewTag({tag});
    }
    res.status(200).json({
      status: 200,
      message: responseMessages[200],
    });
  } catch (e) {
    next(e);
  }

};