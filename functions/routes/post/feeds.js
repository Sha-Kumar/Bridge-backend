const homeRoute = require("express").Router();
const firebase = require("firebase");

const db = require("../../auth/app");
const middleware = require("../../auth/authorization");

function findBranch(branch) {
    let b;
    switch (branch.toUpperCase()) {
        case "COMPUTER SCIENCE AND ENGINEERING": b = 'CS'; break;
        case "INFORMATION SCIENCE AND ENGINEERING": b = 'IS'; break;
        case "MECHANICAL ENGINEERING": b = 'ME'; break;
        case "CIVIL ENGINEERING": b = 'CV'; break;
        case "ELECTRONICS AND COMMUNICATION ENGINEERING": b = 'EC'; break;
        case "MECHATRONICS ENGINEERING": b = 'MT'; break;
        case "AERONAUTICAL ENGINEERING": b = 'AE'; break;
        default: b = 'CS'; break;
    }
    return b;
}
// need to check edge cases like end of the documents
homeRoute.post('/', middleware.checkToken, middleware.authorizeToken, async (req, res) => {
    try {
        
        const limit = 5;
        let time;
        let count = 25;
        var resData = [];
        const con = true;

        if (!req.body.userScope) {
            return res.status(404).send('Invalid Request');
        }

        var qualifier = req.body.userScope;
        qualifier.branch = findBranch(qualifier.branch);

        if (req.body.time) {
            const t = req.body.time;
            time = new firebase.firestore.Timestamp(t.seconds, t.nanoseconds);
        }
        else {
            time = null;
        }

        while (con) {

            if (count <= 0 && resData.length > 5) {
                console.log('After no data it returned for some time');
                break;
            }

            console.log(resData.length.toString() + 'arr len');
            let postsRef;

            if (!time) {
                // eslint-disable-next-line no-await-in-loop
                postsRef = await db.collection("feeds").orderBy("timeStamp", 'desc').limit(limit).get();

                console.log(postsRef.docs.length.toString() + 'how');
            }
            else {
                // eslint-disable-next-line no-await-in-loop
                postsRef = await db.collection("feeds").orderBy("timeStamp", 'desc').startAfter(time).limit(limit).get();
                if (postsRef.empty) {
                    time = null;
                    console.log('breaked due to no data there in the feeds collection !!! ALL are fetched bro...');
                    break;
                }
                console.log(postsRef.docs.length.toString() + 'st');
            }
            if (resData.length >= limit) {
                console.log('breaking the while loop');
                break;
            }

            let last = postsRef.docs[postsRef.docs.length - 1];
            time = last.data().timeStamp;

            postsRef.forEach(element => {
                let data = element.data();
                let resultData = {};
                if (typeof data.scope === "boolean" && data.scope === false) {

                    resultData.postId = element.id;
                    resultData.likes = data.likes.length;
                    resultData.comments = data.comlen;
                    resultData.caption = data.caption;
                    resultData.scope = data.scope;
                    resultData.photoUrl = data.photoUrl;
                    resultData.usertype = data.usertype;
                    resultData.ownerName = data.ownerName;
                    resultData.ownerPhotoUrl = data.ownerPhotoUrl;
                    resultData.ownerId = data.ownerId;
                    resultData.timeStamp = data.timeStamp;

                    resData.push(resultData);
                }
                else {
                    if (data.scope.groups === false && (req.body.usertype === 'faculty' || (data.scope.batch === true || (typeof data.scope.batch === "object" && data.scope.batch.includes(qualifier.batch))))) {

                        if (data.scope.branch === true || (typeof data.scope.branch === "object" && data.scope.branch.includes(qualifier.branch))) {

                            resultData.postId = element.id;
                            resultData.likes = data.likes.length;
                            resultData.comments = data.comlen;
                            resultData.caption = data.caption;
                            resultData.scope = data.scope;
                            resultData.photoUrl = data.photoUrl;
                            resultData.usertype = data.usertype;
                            resultData.ownerName = data.ownerName;
                            resultData.ownerPhotoUrl = data.ownerPhotoUrl;
                            resultData.ownerId = data.ownerId;
                            resultData.timeStamp = data.timeStamp;

                            resData.push(resultData);
                        }
                    } else if (data.scope.branch === false && data.scope.batch === false && typeof data.scope.groups === "object") {
                        if (data.scope.groups.some((v) => qualifier.groups.indexOf(v) !== -1)) {

                            resultData.postId = element.id;
                            resultData.likes = data.likes.length;
                            resultData.comments = data.comlen;
                            resultData.caption = data.caption;
                            resultData.scope = data.scope;
                            resultData.photoUrl = data.photoUrl;
                            resultData.usertype = data.usertype;
                            resultData.ownerName = data.ownerName;
                            resultData.ownerPhotoUrl = data.ownerPhotoUrl;
                            resultData.ownerId = data.ownerId;
                            resultData.timeStamp = data.timeStamp;

                            resData.push(resultData);
                        }
                    }
                }
            });

            count--;
        }
        return res.status(200).send({
            lastTime: time,
            feedData: resData
        });
    } catch (err) {
        return res.send(err.toString());
    }
});

module.exports = homeRoute;