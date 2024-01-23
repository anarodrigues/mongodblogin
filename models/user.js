const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

UserSchema.plugin(passportLocalMongoose);

UserSchema.methods.validPassword = function (password) {
    console.log('Provided password:', password);
    // console.log('Provided password (hashed):', bcrypt.hash(password, 10));
    console.log('Stored password hash:', this.password);
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', UserSchema);

// Connect to MongoDB
mongoose.connect('mongodb://localhost/yourdb', { useNewUrlParser: true, useUnifiedTopology: true });

let create = false;
if (create) {
    // UserSchema.pre('save', function (next) {
    //     if (this.isModified('password')) {
    //         this.password = bcrypt.hashSync(this.password, 10);
    //     }
    //     next();
    // });

    // Create users
    const users = ['x', 'y', 'z'].map(username => {
        const saltRounds = 10;
        let password = 'x';
        const passwordHash = bcrypt.hashSync(password, saltRounds);
        const user = new User({ username, password: passwordHash });
        return user.save()
            .then(() => {
                console.log('User saved successfully:', username, passwordHash);
            })
            .catch(err => {
                console.log(err);
            });
    });

    // Save users
    Promise.all(users)
        .then(() => console.log('Users created'))
        .catch(err => console.error(err))
        .finally(() => mongoose.connection.close());
}

module.exports = mongoose.model('User', UserSchema);