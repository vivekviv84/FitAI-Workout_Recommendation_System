const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  try {
    const signupRes = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testnode@example.com', password: 'TestPass123', name: 'Node Test' })
    })
    console.log('signup status', signupRes.status)
    console.log('signup headers', Array.from(signupRes.headers.entries()))
    const signupBody = await signupRes.text()
    console.log('signup body', signupBody)

    const signinRes = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testnode@example.com', password: 'TestPass123' })
    })
    console.log('signin status', signinRes.status)
    console.log('signin headers', Array.from(signinRes.headers.entries()))
    const signinBody = await signinRes.text()
    console.log('signin body', signinBody)
  } catch (err) {
    console.error('error', err)
  }
}

run()
