const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const { clerkMiddleware, getAuth } = require('@clerk/express');

const app = express();
app.use(cookieParser()); // parse cookies
app.use(bodyParser.json());
app.use(clerkMiddleware()); // https://clerk.com/docs/references/express/overview
app.use(cors());

const port = process.env.PORT || 3000; // use port 3000 if no port is specified

const { PrismaClient } = require('@prisma/client');
const { clerkClient } = require('./lib/clerk');
const prisma = new PrismaClient();

// write a GET /students endpoint that returns a list of all students
// consider an optional school query parameter and filter by school
app.get('/students', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json([]);
  }
  // instead of only school, generically filter by any property name
  if (req.query) {
    const propertyNames = Object.keys(req.query);
    let students = await prisma.student.findMany();
    for (const propertyName of propertyNames) {
      students = students.filter((s) => s[propertyName] === req.query[propertyName]);
    }
    res.json(students);
  } else {
    // else, respond with the entire list
    res.json(studentList);
  }
});

// write a GET /students/:id endpoint that returns a single student by id
app.get('/students/:id', async (req, res) => {
  // id exists in the request
  const id = req.params.id;

  // find student with matching ID and respond with the student
  const student = await prisma.student.findUnique({
    select: { sId: true },
    where: { sId: id },
  });
  if (student) {
    res.json(student);
  } else {
    res.status(404).json({ message: 'student not found' });
  }
});

app.post('/login', async (req, res) => {
  const { emailAddress, password } = req.body;
  const dbUser = await prisma.user.findUnique({ where: { email: emailAddress.toLowerCase() } });
  if (!dbUser) {
    res.status(401).json({ message: 'error logging in' });
  }
  const { verified } = await clerkClient.users.verifyPassword({ userId: dbUser.authId, password });
  if (!verified) {
    res.status(401).json({ message: 'error logging in' });
  }

  const signInToken = await clerkClient.signInTokens.createSignInToken({ userId: dbUser.authId });
  res.cookie('accessToken', signInToken.token, {
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : 'localhost',
  });

  res.json(signInToken);
});

app.post('/register', async (req, res) => {
  const { emailAddress, password } = req.body;
  const user = await clerkClient.users.createUser({ emailAddress: [emailAddress], password });
  await prisma.user.create({ data: { authId: user.id, email: emailAddress.toLowerCase() } });

  const signInToken = await clerkClient.signInTokens.createSignInToken({ userId: user.id });
  res.cookie('accessToken', signInToken.token, {
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : 'localhost',
  });
  res.json(signInToken);
});

app.get('/logout', async (req, res) => {
  res.clearCookie('accessToken');
  res.json({ message: 'logged out' });
});

// create a student
app.post('/students', async (req, res) => {
  console.log(req.body);

  const students = await prisma.student.create({ data: { ...req.body, grade: 'FRESHMAN' } });
  res.json(students);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
