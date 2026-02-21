 const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/fitness_db_test_login', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    await User.deleteMany({});

    const user = await User.create({
        name: 'Test',
        email: 'test@example.com',
        passwordHash: 'password123',
    });

    console.log('Saved user passwordHash:', user.passwordHash);

    const isMatch = await user.comparePassword('password123');
    console.log('Password match:', isMatch);

    await mongoose.disconnect();
}

run().catch(console.error);
