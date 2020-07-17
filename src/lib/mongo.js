const { MongoClient, ObjectId } = require('mongodb');

const {
  db_user,
  db_password,
  db_name,
  db_cluster,
} = require('../config/index');

const mongoUri = `mongodb+srv://${db_user}:${db_password}@${db_cluster}/${db_name}?retryWrites=true&w=majority`;

class MongoLib {
  constructor() {
    this.client = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.dbName = db_name;
  }

  connect() {
    if (!MongoLib.connection) {
      MongoLib.connection = new Promise((resolve, reject) => {
        this.client.connect((err) => {
          if (err) {
            reject(err);
          }

          resolve(this.client.db(this.dbName));
        });
      });
    }
    return MongoLib.connection;
  }

  async get(collection, id, projection = {}) {
    const db = await this.connect();
    return db
      .collection(collection)
      .findOne({ _id: new ObjectId(id) }, { projection });
  }

  async getAll(collection, query = {}, required = {}) {
    const db = await this.connect();
    return db.collection(collection).find(query).project(required).toArray();
  }

  async textSearch(collection, text, projection = {}, limit, page) {
    const db = await this.connect();
    return db
      .collection(collection)
      .find({ userName: { $regex: `.*${text}.*` } }, { projection })
      .skip(page * 10)
      .limit(limit)
      .toArray();
  }

  async create(collection, data) {
    const db = await this.connect();
    return db.collection(collection).insertOne(data).insertedId;
  }

  async update(collection, id, data) {
    const db = await this.connect();
    const result = await db
      .collection(collection)
      .updateOne({ _id: new ObjectId(id) }, { $set: data });

    return result.upsertedId || id;
  }

  async deleteFromArray(collection, id, field, value) {
    const db = await this.connect();
    return db
      .collection(collection)
      .updateOne({ _id: new ObjectId(id) }, { $pull: { [field]: value } });
  }

  async appendFromArray(collection, id, field, value) {
    const db = await this.connect();
    return db
      .collection(collection)
      .updateOne({ _id: new ObjectId(id) }, { $addToSet: { [field]: value } });
  }

  async aggregation(collection, config) {
    const db = await this.connect();
    return await db.collection(collection).aggregate(config).toArray();
  }

  async delete(collection, id) {
    const db = await this.connect();
    await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
    return id;
  }

  async countDocuments(collection, query) {
    const db = await this.connect();
    return db.collection(collection).estimatedDocumentCount(query);
  }
}

module.exports = MongoLib;
