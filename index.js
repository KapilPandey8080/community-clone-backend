const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- PostgreSQL Connection using Sequelize ---
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
});

// --- Database Models (Sequelize) ---
const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    bio: { type: DataTypes.TEXT, defaultValue: 'No bio yet.' },
});

const Post = sequelize.define('Post', {
    content: { type: DataTypes.TEXT, allowNull: false },
});

// --- Model Associations ---
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });


// --- JWT Middleware ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // --- CHANGE: Make sure the payload structure matches what you sign ---
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// --- API Routes ---

// 1. User Registration
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, bio } = req.body;
    try {
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        user = await User.create({ name, email, password: hashedPassword, bio });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            // --- CHANGE: Return the user object along with the token ---
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    bio: user.bio
                }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// 2. User Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            // --- CHANGE: Return the user object along with the token ---
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    bio: user.bio
                }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- NEW ROUTE (Required by Frontend) ---
// 3. Get Logged-in User Data
// @route   GET /api/auth/me
// @desc    Get current user data from token
// @access  Private
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
      // req.user.id is attached by the authMiddleware
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});


// 4. Create a Post (Protected)
app.post('/api/posts', authMiddleware, async (req, res) => {
    const { content } = req.body;
    try {
        const postData = await Post.create({
            content,
            authorId: req.user.id
        });
        // To match the feed format, we fetch the post with author info
        const post = await Post.findByPk(postData.id, {
             include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name']
            }],
        });
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 5. Get All Posts (Public Feed)
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.findAll({
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 6. Get User Profile
app.get('/api/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId || isNaN(parseInt(userId, 10))) {
            return res.status(400).json({ msg: 'Invalid or missing user ID.' });
        }
        const user = await User.findByPk(parseInt(userId, 10), {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 7. Get All Posts by a specific user
app.get('/api/users/:userId/posts', async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId || isNaN(parseInt(userId, 10))) {
            return res.status(400).json({ msg: 'Invalid or missing user ID for posts.' });
        }
        const posts = await Post.findAll({
            where: { authorId: parseInt(userId, 10) },
            include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- Sync Database and Start Server ---
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connection has been established successfully.');
        await sequelize.sync(); 
        console.log("All models were synchronized successfully.");
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
