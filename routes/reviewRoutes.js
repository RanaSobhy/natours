const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourAndUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReviewById)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReviewById
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReviewById
  );

module.exports = router;
