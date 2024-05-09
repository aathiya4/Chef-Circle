
const Recipe = require('./models/recipes');
const Review = require('./models/review');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        console.log(req.session.returnTo);
        console.log(req.session);
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateRecipe = (req, res, next) => {
    const { error } = Recipe.validate(req.body);
    console.log(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    console.log(recipe.createdBy);
   
    if (!recipe.createdBy.equals(req.user._id || req.passport.user )) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/recipes/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    console.log(review.author);
    console.log(req.user._id);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/recipes/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = Review.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}