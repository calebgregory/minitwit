'use strict';

var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');

var mongo = require('../../lib/mongo/');

var pg = require('pg');
var url = 'postgres://localhost:5432'

var query = (sql, params, cb) => {
  var callback = typeof params === 'function' ? params : cb;

  pg.connect(`${url}/atmebro`, (err, db, done) => {
    if(err) throw err;

    if(typeof params === 'function') {
      db.query(sql, (err, res) => {
        if(err) throw err;
        callback(err, res.rows);
      });
    } else {
      db.query(sql, params, (err, res) => {
        if(err) throw err;
        callback(err, res.rows);
      });
    }
  })
};

(function bootstrap() {
  pg.connect(url, (err, db, done) => {
    if(err) throw err;

    db.query('CREATE DATABASE atmebro;', err => {
      if(err.message === 'database "atmebro" already exists') {
        pg.connect(`${url}/atmebro`, (err, db, done) => {
          db.query('CREATE TABLE IF NOT EXISTS posts ('+
            '_id SERIAL PRIMARY KEY NOT NULL,'+
            'text VARCHAR(40) NOT NULL'+
            ');', (err,res) => {
              done();
            });
        });
      } else if(err) {
        throw err;
      }
    });
  });
})();

function Post(p) {
  this.text = p.text;
}

Object.defineProperty(Post, 'collection', {
  get: function () {
    return mongo.getDb().collection('posts');
  }
});

Post.count = function (cb) {
  query('SELECT COUNT(*) FROM posts;', cb);
//  return Post.collection.count(cb);
};

Post.create = function (post, cb) {
  query(`INSERT INTO posts (text) VALUES ($1);`, [post.text], cb);
//  Post.collection.insertOne(post, cb);
};

Post.setHidden = function (id, cb) {
  Post.collection.findOneAndUpdate({_id: ObjectID(id)},
    {$set: {hidden : true}},
    {returnOriginal : false},
  cb);
};

Post.dropCollection = function (cb) {
  Post.collection.drop(cb);
};

Post.findById = function (id, cb) {
  Post.collection.findOne({_id: ObjectID(id)}, function (err, post) {
    cb(err, setPrototype(post));
  });
};


Post.findAll = function (cb) {
  query('SELECT * FROM posts;', (err,posts) => {
    var prototypedPosts = posts.map(function (post) {
      return setPrototype(post);
    });

    cb(err, prototypedPosts);
  });
//  Post.collection.find({hidden: {$ne: true}}).toArray(function (err, posts) {
//    var prototypedPosts = posts.map(function (post) {
//      return setPrototype(post);
//    });
//
//    cb(err, prototypedPosts);
//  });
};

module.exports = Post;

function setPrototype(pojo) {
  return _.create(Post.prototype, pojo);
}
