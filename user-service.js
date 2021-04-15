const mongoose = require("mongoose");

mongoose.set("useFindAndModify", false); 

const bcrypt = require("bcryptjs");

let mongoDBConnectionString = process.env.MONGO_URL;  // mongodb

let Schema = mongoose.Schema;

// ===================================================

let userSchema = new Schema({
  
  userName: {
  
    type: String,
  
    unique: true,
  },
  
  password: String,
  
  favourites: [String],
});

let User;

// =================================================

module.exports.connect = function () {
 
  return new Promise(function (resolve, reject) {
 
    let db = mongoose.createConnection(mongoDBConnectionString, {
 
      useUnifiedTopology: true,
    });

    // ========================================

    db.on("error", (error) => {
      reject(error);
    });

    // =========================================

    db.once("open", () => {
    
      User = db.model("users", userSchema);
     
      resolve();
    });
  });
};

// =======================================

module.exports.byId = (the_id) => {
  
  return User.findById(the_id).exec();
};

// ===================================================

module.exports.registerUser = function (userData) {
  
  return new Promise(function (resolve, reject) {
  
    if (userData.password != userData.password2) {
  
      reject("Passwords do not match");
  
    } else {
  
      bcrypt
  
      .hash(userData.password, 10)
  
      .then((hash) => {
  
        userData.password = hash;

          let new_User = new User(userData);

          new_User.save((err) => {
        
            if (err) {
        
              if (err.code == 11000) {
        
                reject("User Name already taken");
        
              } else {
        
                reject("There was an error creating the user: " + err);
              }
            } else {
        
              resolve("User " + userData.userName + " successfully registered");
            }
          });
        })
        .catch((err) => reject(err));
    }
  });
};

// ===================================================

module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    
    User.findOne({ userName: userData.userName })
    
    .exec()
    
    .then((user) => {
    
      bcrypt.compare(userData.password, user.password).then((res) => {
    
        if (res === true) {
    
          resolve(user);
    
        } else {
    
          reject("Incorrect password for user " + userData.userName);
          }
        });
      })
      .catch((err) => {
      
        reject("Can not find user " + userData.userName);
      });
  });
};

// ======================================================

module.exports.getFavourites = function (id) {
  
  return new Promise(function (resolve, reject) {
  
    User.findById(id)
  
    .exec()
  
    .then((user) => {
  
      resolve(user.favourites);
  
    })
  
    .catch((err) => {
  
      reject(`Can not get favourites for user with id: ${id}`);
  
    });
  });
};

// ==========================================================

module.exports.addFavourite = function (id, favId) {
 
  return new Promise(function (resolve, reject) {
 
    User.findById(id)
 
    .exec()
 
    .then((user) => {
 
      if (user.favourites.length < 50) {
 
        User.findByIdAndUpdate(
 
          id,
 
          { $addToSet: { favourites: favId } },
 
          { new: true }
 
          )
 
          .exec()
 
          .then((user) => {
 
            resolve(user.favourites);
 
          })
 
          .catch((err) => {
 
            reject(`Can not update favourites for user with id: ${id}`);
 
          });
        } else {
 
          reject(`Can not update favourites for user with id: ${id}`);
        }
      });
  });
};

// =====================================================

module.exports.removeFavourite = function (The_id, favId) {
 
  return new Promise(function (resolve, reject) {
 
    User.findByIdAndUpdate(The_id, { $pull: { favourites: favId } }, { new: true })
 
    .exec()
 
    .then((user) => {
 
      resolve(user.favourites);
      })
 
      .catch((err) => {
 
        reject(`Can not update favourites for user with id: ${The_id}`);
      });
  });
};
