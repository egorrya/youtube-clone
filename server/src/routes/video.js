import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();

function getVideoRoutes() {
  const router = express.Router();

  // ./api/v1/videos
  router.get("/", getRecommendedVideos);

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

async function getTrendingVideos(req, res) {}

async function searchVideos(req, res, next) {}

async function addVideo(req, res) {}

async function addComment(req, res, next) {}

async function deleteComment(req, res) {}

async function addVideoView(req, res, next) {}

async function likeVideo(req, res, next) {}

async function dislikeVideo(req, res, next) {}

async function getVideo(req, res, next) {}

async function deleteVideo(req, res) {}

export { getVideoRoutes };
