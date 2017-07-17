const mongoose = require('mongoose'),
        Schema = mongoose.Schema;

const UsersSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    activities: [{ type: Schema.Types.ObjectId, ref: "Activity" }]
});

const Users = mongoose.model('Users', UsersSchema);
const ActivitySchema = new mongoose.Schema({
    type: { type: String, required: true },
    description: { type: String },
    _user: { type: String, ref: 'Users' },
    enteries: [{ type: Schema.Types.ObjectId, ref: "Entry" }]
});

const Activity = mongoose.model('Activity', ActivitySchema);
const EntrySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    quantity: { type: Number, required: true },
});

const Entry = mongoose.model('Entry', EntrySchema);

module.exports = { 
    users: Users,
    activities: Activity,
    enteries: Entry
};