(async () => {
    try {
        console.log('--- SIGNUP ---');
        const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Fetch User',
                email: 'testfetch@example.com',
                password: 'password123'
            })
        });
        const signupData = await signupRes.json();
        console.log('Signup Res:', signupData);

        console.log('\n--- LOGIN ---');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testfetch@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Res:', loginData);

    } catch (e) {
        console.error(e);
    }
})();
