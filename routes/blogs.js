const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const authMiddleware = require('../middleware/auth');
const calculateReadingTime = require('../utils/readingTime');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

const Blog = require('../models/blog');

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { title, description, tags, body } = req.body;
    const authorId = req.user;

    const newBlog = new Blog({
      title,
      description,
      author: authorId,
      tags,
      body,
    });

    await newBlog.save();
    logger.info('Blog created:', newBlog);
    res.status(201).json(newBlog);
  } catch (error) {
    logger.error('Error creating a blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a blog (requires authentication and owner verification)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const blogId = req.params.id;
    const { title, description, tags, body } = req.body;
    const authorId = req.user;

    const blog = await Blog.findById(blogId);

    if (!blog) {
      logger.error('Blog not found');
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.author.toString() !== authorId) {
      logger.error('You are not the owner of this blog');
      return res.status(403).json({ error: 'You are not the owner of this blog' });
    }

    blog.title = title;
    blog.description = description;
    blog.tags = tags;
    blog.body = body;

    await blog.save();
    logger.info('Blog updated:', blog);
    res.status(200).json(blog);
  } catch (error) {
    logger.error('Error updating a blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a blog (requires authentication and owner verification)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const blogId = req.params.id;
    const authorId = req.user;

    const blog = await Blog.findById(blogId);

    if (!blog) {
      logger.error('Blog not found');
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.author.toString() !== authorId) {
      logger.error('You are not the owner of this blog');
      return res.status(403).json({ error: 'You are not the owner of this blog' });
    }

    await blog.remove();
    logger.info('Blog deleted:', blogId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting a blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId).populate('author');

    if (!blog) {
      logger.error('Blog not found');
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.read_count += 1;
    await blog.save();

    const readingTime = calculateReadingTime(blog.body);

    logger.info('Single blog retrieved:', blogId);
    res.status(200).json({
      ...blog.toObject(),
      readingTime,
    });
  } catch (error) {
    logger.error('Error getting a single blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a list of blogs with pagination, filtering, searching, and ordering
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.query.state) {
      query.state = req.query.state;
    }
    if (req.query.author) {
      query.author = req.query.author;
    }
    if (req.query.tags) {
      query.tags = { $in: req.query.tags.split(',') };
    }

    let sort = {};
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.order === 'desc' ? -1 : 1;
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const totalBlogs = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author');

    logger.info('List of blogs retrieved:', blogs.length);
    res.status(200).json({
      blogs,
      page,
      pages: Math.ceil(totalBlogs / limit),
    });
  } catch (error) {
    logger.error('Error getting a list of blogs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
