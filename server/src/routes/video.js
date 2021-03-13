import { PrismaClient } from "@prisma/client";
import express from "express";
import { protect } from "../middleware/authorization";

const prisma = new PrismaClient();

function getVideoRoutes() {
  const router = express.Router();

  // ./api/v1/videos
  router.get("/", getRecommendedVideos);
  router.get("/trending", getTrendingVideos);
  router.get("/search", searchVideos);

  router.post("/", protect, addVideo);
  router.post("/:videoId/comment", protect, addComment);
  router.delete("/:videoId/comment/:commentId", protect, deleteComment);

  return router;
}

// count views on videos
async function getVideoViews(videos) {
  for (const video of videos) {
    const views = await prisma.view.count({
      where: {
        videoId: {
          equals: video.id,
        },
      },
    });
    video.views = views;
  }

  return videos;
}

async function getRecommendedVideos(req, res) {
  let videos = await prisma.video.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // if we dont have any video, we wont generate a views for this
  if (!videos.lenght) {
    return res.status(200).json({ videos });
  }

  videos = await getVideoViews(videos);

  res.status(200).json({ videos });
}

async function getTrendingVideos(req, res) {
  let videos = await prisma.video.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // if we dont have any video, we wont generate a views for this
  if (!videos.lenght) {
    return res.status(200).json({ videos });
  }

  videos = await getVideoViews(videos);
  // js descending order where videos with the most views go first
  videos.sort((a, b) => b.views - a.views);

  res.status(200).json({ videos });
}

async function searchVideos(req, res, next) {
  if (!req.query.query) {
    return next({
      message: "Please enter a search query",
      statusCode: 400,
    });
  }

  let videos = await prisma.video.findMany({
    include: {
      user: true,
    },
    where: {
      OR: [
        {
          title: {
            contains: req.query.query,
            mode: "insensitive",
          },
          description: {
            contains: req.query.query,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (!videos.lenght) {
    return res.status(200).json({ videos });
  }

  videos = await getVideoViews(videos);

  res.status(200).json({ videos });
}

async function addVideo(req, res) {
  const { title, description, url, thumbnail } = req.body;

  const video = await prisma.video.create({
    data: {
      title,
      description,
      url,
      thumbnail,
      user: {
        connect: {
          id: req.user.id,
        },
      },
    },
  });

  res.status(200).json({ video });
}

async function addComment(req, res, next) {
  const video = await prisma.video.findUnique({
    where: {
      id: req.params.videoId,
    },
  });

  if (!video) {
    return next({
      message: `No video found with id: "${req.params.videoId}"`,
      statusCode: 404,
    });
  }

  const comment = await prisma.comment.create({
    data: {
      text: req.body.text,
      user: {
        connect: {
          id: req.user.id,
        },
      },
      video: {
        connect: {
          id: req.params.videoId,
        },
      },
    },
  });

  res.status(200).json({ json });
}

async function deleteComment(req, res) {
  const comment = await prisma.comment.findUnique({
    where: {
      id: req.params.commentId,
    },
    select: {
      userId: true,
    },
  });

  if (comment.userId !== req.user.id) {
    return res
      .status(401)
      .send("You are not authorized to delete this comment");
  }

  await prisma.comment.delete({
    where: {
      id: req.params.commentId,
    },
  });

  res.status(200).json({ json });
}

async function addVideoView(req, res, next) {}

async function likeVideo(req, res, next) {}

async function dislikeVideo(req, res, next) {}

async function getVideo(req, res, next) {}

async function deleteVideo(req, res) {}

export { getVideoRoutes };
