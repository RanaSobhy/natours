const express = require('express');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const viewsController = require('../controllers/viewsController');

const router = express.Router();

router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

router.use(authController.isLoggedIn);

router.get(
  '/',
  bookingController.createBookingCheckout,
  viewsController.getOverview
);

router.get('/tour/:slug', viewsController.getTour);

router.get('/login', viewsController.getLoginPage);

module.exports = router;
