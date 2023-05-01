const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [50, 'A tour name must be less than or equal 50 characters'],
      minlength: [
        10,
        'A tour name must be greater than or equal 10 characters',
      ],
      // validate: [validator.isAlpha, 'Name must contain only characters'],
    },
    slug: String,
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      //only for strings
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A tour must have a difficulty easy, medium or difficult only',
      },
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be greater than or equal to 1.0'], // avaiable for dates too
      max: [5, 'Rating must be less than or equal to 5.0'], // avaiable for dates too
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'price ({VALUE}) discount should be less than price',
        validator: function (value) {
          //this will not work on update
          //tis only points to current doc on NEW docuement creation
          return value < this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: { type: String, trim: true },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: { type: Date, default: Date.now(), select: false },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //used to embed User object in the tour object, will use referencing instead
    // guides: Array,
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//declare indecies to make querying using these fields faster instead of examining all documents
//1 = asc order, -1 = desc order
// mongoose by default creates index for unique fields
// tourSchema.index({ price: 1 });

//compound index for multiple fields together
//index also works when querying with one of these fields and there is no need to crete a unique index for each
tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//cant be used in queries
//must be a regular function not a lamda function to be able to use this
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//Document Middleware
//run before .save() and .create() but not .insertMany()
//can have multiple middleware for the same hook
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//used to embed User object in the tour object, will use referencing instead
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// //run after all the pre middlewares have been completed
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//Query middlewares
//runs before or after a certain query is executed
// tourSchema.pre(/^find/, function (next) {
//   // tourSchema.pre('find', function (next) {
//   this.find({ secretTour: { $ne: true } });
//   this.start = Date.now();
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

//Aggregation Middleware
// runs before or after an aggregation runs
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
