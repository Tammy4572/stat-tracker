const express = require('express');
const route = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const data = require('../models/data');
var moment = require('moment');
moment().format();

// returns all activities associated with current user
route.get('/api/users/:id/activities', passport.authenticate('jwt', {session: false}), async (request, response) => {
    await data.users.find({ id: request.params.id })
        .populate('activities')
        .exec(function(err, data) {
            if (!data[0].activities[0]) {
                return response.status(404).send({ message: 'No activities entered yet' });
            }
            return response.status(200).json(data[0].activities);
        });
});

// //add activity for current user
route.post('/api/users/:id/activities', passport.authenticate('jwt', {session: false }), async (request, response) => {
    if (request.body.type && request.body.description) {
        var user = await data.users.find({ _id: request.params.id })
            .populate('activities')
            .exec(function (err, result) {
                if (result[0].activities.find(q => q.type === request.body.type) === undefined) {
                    var newActivity = new data.activities({
                        type: request.body.type,
                        description: request.body.description
                    });
                    newActivity.save(function(err, data) {
                        user[0].activites.push(data._id);
                        user[0].save();
                        return response.status(200).json(newActivity);
                    });
                } else {
                    return response.status(409).json({ message: 'activity already entered '});
                }
            })
    }
        else {
            return response.status(400).json({ message: 'incomplete data fields '});
        }
});

// //single activity with data tracked
route.get('/api/activities/:id', passport.authenticate('jwt', { session: false }), async (request, response) => {
    var activity = await data.activities.find({ _id: request.params.id })
        .populate('entries')
        .exec(function(err, data) {
            if (!data[0].entries[0]) {
                return response.status(400).send({ message: 'No entries found. '});
            } else {
                var sorted = data[0].entries.sort('-data');
                return response.status(200).json(sorted);
            }
        });
});

// //only updates type, not entry
route.put('/api/activities/:id', passport.authenticate('jwt', { session: false }), async (request, response) => {
    if (request.body.type && request.body.description) {
        var activity = await data.activities.findOneAndUpdate({ _id: request.params.id },
        {
            type: request.body.type,
            description: request.body.description
        });
        var updated = await data.activities.find({ _id: request.params.id });
        return response.status(200).json(updated);
    } else {
        return response.status(400).json({ message: 'Incomplete data fields '});
    }
});

// //deletes whole activity and tracked data
route.delete('/api/activities/:id', passport.authenticate('jwt', { session: false }), async (request, response) => {
    var deleteActivity = await data.activities.find({ _id: request.params.id });
    if (!deleteActivity[0]) {
        return response.status(400).json({ message: 'Activity not found '});
    } else {
        await data.activities.findOneAndRemove({ _id: request.params.id });
    }
    await data.users.find({ activites: { $in: [request.params.id ] } }, function (err, data ) {
        data[0].activities.splice(data[0].activities.indexOf(request.params.id), 1);
        data[0].save(function(err) {
            return response.status(200).json(deletedActivity);
        });
    });
});

// //adds or updates tracked data & validates the data is in correct format
route.post('/api/activities/:id/entries', passport.authenticate('jwt', { session: false }), async (request, response) => {
    if (request.body.date && request.body.quantity) {
         var isoDate = new Date(request.body.date).toISOString();
         var newEntry = { date: isoDate, quantity: request.body.quantity };
         var activitiy = await data.activities.find({ _id: request.params.id })
            .populate('entries')
            .exec(function (err, data) {
                if(err) return handleError(err);
            });
        var entryIndex = activity[0].entries.findIndex(q => q.date === isoDate);
        var entryId = activitiy[0].entries.find(q => q.date === isoDate);
        var entryCheck = await data.entries.find({ date: isoDate });
        if (entryIndex === -1 && !entryCheck[0]) {
            var newEntry = new data.entries(newEntry);
            newEntry.save(function (err, data) {
                activity[0].entries.push(data._id);
                activity[0].save();
                return response.status(200).json(newEntry);
            });
        } else {
            await data.entries.findOneAndUpdate({ date: isoDate }, 
                {
                    $set: {
                        quantity: request.body.quantity
                    }
                })
            var updatedEntry = await data.entries.find({ date: isoDate });
            return response.status(200).json(updatedEntry);
        };
    } else {
        return response.status(400).json({ message: 'incomplete data '});
    }
});

// //removes tracked data 
route.delete('/api/entries/:id', passport.authenticate('jwt', { session: false }), async (request, response) => {
    var deleted = await data.entries.find({ _id: request.params.id });
    if (!deleted[0]) {
        return response.status(400).json({ message: 'Entry not found '});
    } else {
        await data.entries.findOneAndRemove({ _id: request.params.id });
    }
    await data.activities.find({ entries: { $in: [request.params.id ] }, }, function (err, data ) {
        data[0].entries.splice(data[0].entries.indexOf(request.params.id), 1);
        data[0].save(function (err) {
            return response.status(200).json(deleted);
        });
    });
});

module.exports = route;
