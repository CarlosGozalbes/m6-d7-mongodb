import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import AuthorsModel from "../services/authors/schema.js";
import { authenticateAuthor } from "./tools.js";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: `${process.env.API_URL}/authors/googleRedirect`,
  },
  async (accessToken, refreshToken, profile, passportNext) => {
    try {
      // this callback is executed when Google send us a successfull response back
      // here we are receiving some informations about the user from Google (scopes --> profile, email)
      console.log(profile);

      // 1. Check if the user is already in our db
      const author = await AuthorsModel.findOne({
        email: profile.emails[0].value,
      });

      if (author) {
        // 2. If the user is there --> generate accessToken (optionally a refreshToken)
        const token = await authenticateAuthor(author);

        // 3. We go next (we go to the route handler)
        passportNext(null, { token, role: author.role });
      } else {
        // 4. Else if the user is not in our db --> add the user to db and then create token(s) for him/her

        const newAuthor = new AuthorsModel({
          name: profile.name.givenName,
          surname: profile.name.familyName,
          email: profile.emails[0].value,
          googleId: profile.id,
        });

        const savedAuthor = await newAuthor.save();
        const token = await authenticateAuthor(savedAuthor);

        // 5. We go next (we go to the route handler)
        passportNext(null, { token });
      }
    } catch (error) {
      passportNext(error);
    }
  }
);

// if you get the "Failed to serialize user into session" error, you have to add the following code

passport.serializeUser((data, passportNext) => {
  passportNext(null, data);
});

export default googleStrategy;
