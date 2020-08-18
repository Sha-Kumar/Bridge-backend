const express = require('express');
const parser = require('body-parser');
const jwt = require('jsonwebtoken');
const firebase = require('firebase');

const db = require('../../app');
const middleware = require('../auth/middleware');
const secret = require('../auth/facconfig');

const facultyRouter = express.Router();
facultyRouter.use(parser.json());

facultyRouter.post('/',middleware.requestHandler, middleware.requestUser, async(req, res, next) => {
    try {
        let listval = [];
        if(!req.alreadySignin){
            const uid = req.uid;
            var obj = {
                email : req.body.email,
                photoUrl : req.body.photoUrl,
                name : req.body.name,
                phone : Number(req.body.phone),
                branchName : req.branchName,
                facultyId : req.facultyId,
                bookmarks : listval
            }
            let jsonwebtoken = jwt.sign({ id : req.uid, user : 'faculties' }, req.body.token);
            secret.secret(req.body.token);
            //console.log(secret.AuthSecret());
            obj.token = [jsonwebtoken];
            const docRef = db.collection('faculties').doc(uid);
            await docRef.set(obj);
            const result = (await docRef.get()).data();
            let resobj = {};
            resobj.authorizeToken = jsonwebtoken;
            resobj.data = result;
            return res.status(201).send(resobj);

        }

        const docRef = await db.collection('faculties').doc(req.uid);
        if((await docRef.get()).exists){
            var jsonwebtoken = jwt.sign({ id : req.uid, user : 'faculties' }, req.body.token);
            await docRef.update({
                token : firebase.firestore.FieldValue.arrayUnion(jsonwebtoken)
            });
            let result = (await docRef.get()).data();
            secret.secret(req.body.token);
            let resobj = {};
            resobj.authorizeToken = jsonwebtoken;
            resobj.data = result;
            //console.log(secret.AuthSecret());
            return res.status(200).send(resobj);
        }
        
        return res.status(400).send('Invalid Credentials');

    } catch (err) {
        return res.send(err);
    }
});

module.exports = facultyRouter;
