const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewsRouter = require('./routes/viewsRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//set security http headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      'script-src': [
        "'self'",
        'blob:',
        '*.mapbox.com',
        '*.cloudflare.com',
        'https://checkout.stripe.com',
        'https://js.stripe.com/v3/',
      ],
      'default-src': ["'self'"],
      'frame-src': [
        "'self'",
        'https://checkout.stripe.com',
        'https://js.stripe.com/v3/',
      ],
      'connect-src': [
        "'self'",
        'https://*.mapbox.com',
        'https://*.cloudflare.com',
        'https://checkout.stripe.com',
        'ws:',
      ],
      'img-src': ["'self'", 'https://*.stripe.com', 'data:'],
    },
  })
);

app.use(helmet.crossOriginEmbedderPolicy({ policy: 'credentialless' }));

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

//body parser, read data from req.body
app.use(express.json({ limit: '10kb' }));

//parse url encoded parameters, read data from req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//cookie parser ,read data from req.cookies
app.use(cookieParser());

//data sanitization against noSQL data injection
app.use(mongoSanitize());

//data sanitization against cross site scripting attacks
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//test middleware
// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  //if next recieves any argument, express will
  //automatically assume its an error and
  //send it to the error middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//express automatically knows that this is an error handling middleware
app.use(globalErrorHandler);

module.exports = app;
