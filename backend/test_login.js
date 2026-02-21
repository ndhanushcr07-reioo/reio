const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/adaptive_fitness_test', {
        });

        await User.deleteMany({ email: 'test_login@example.com' });

        const user = await User.create({
            name: 'Test Login',
            email: 'test_login@example.com',
            passwordHash: 'password123',
        });

        console.log('Saved user passwordHash:', user.passwordHash);

        const isMatch = await user.comparePassword('password123');
        console.log('Password match:', isMatch);

        const isWrong = await user.comparePassword('wrongpassword');
        console.log('Wrong password match:', isWrong);

        // also via findOne
        const found = await User.findOne({ email: 'test_login@example.com' });
        console.log('Found generic:', await found.comparePassword('password123'));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
