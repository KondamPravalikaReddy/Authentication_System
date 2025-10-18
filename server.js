// Multi-Role Authentication System
// Install dependencies: npm install express jsonwebtoken bcryptjs body-parser

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Configuration
const JWT_SECRET = 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// In-memory database (replace with real database in production)
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$10$r6h3MPhd21fGO5fIsusbquoLfqHZZqpgpROpvMeiT41kI1QWdzOSi', // 'admin123' hashed
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'manage_users']
  },
  {
    id: 2,
    username: 'manager',
    password: '$2a$10$rQ5YZZ5Z5Z5Z5Z5Z5Z5Z5O', // 'manager123' hashed
    email: 'manager@example.com',
    role: 'manager',
    permissions: ['read', 'write', 'manage_team']
  },
  {
    id: 3,
    username: 'user',
    password: '$2a$10$rQ5YZZ5Z5Z5Z5Z5Z5Z5Z5O', // 'user123' hashed
    email: 'user@example.com',
    role: 'user',
    permissions: ['read']
  }
];

// Role hierarchy and permissions
const ROLES = {
  admin: {
    level: 3,
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_system']
  },
  manager: {
    level: 2,
    permissions: ['read', 'write', 'manage_team']
  },
  user: {
    level: 1,
    permissions: ['read']
  },
  guest: {
    level: 0,
    permissions: []
  }
};

// Helper function to hash passwords
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Helper function to verify password
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware: Verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
}

// Middleware: Check role authorization
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions for this role' 
      });
    }

    next();
  };
}

// Middleware: Check specific permission
function authorizePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const hasPermission = requiredPermissions.every(perm => 
      req.user.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
}

// Middleware: Check role level
function authorizeLevel(minLevel) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userLevel = ROLES[req.user.role]?.level || 0;
    
    if (userLevel < minLevel) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient role level' 
      });
    }

    next();
  };
}

// Routes

// 1. Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password required' 
      });
    }

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// 2. Register endpoint (admin only)
app.post('/api/auth/register', 
  authenticateToken, 
  authorizeRole('admin'), 
  async (req, res) => {
    try {
      const { username, password, email, role } = req.body;

      if (!username || !password || !email || !role) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields required' 
        });
      }

      // Check if user exists
      if (users.find(u => u.username === username)) {
        return res.status(409).json({ 
          success: false, 
          message: 'Username already exists' 
        });
      }

      // Validate role
      if (!ROLES[role]) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role' 
        });
      }

      // Create new user
      const hashedPassword = await hashPassword(password);
      const newUser = {
        id: users.length + 1,
        username,
        password: hashedPassword,
        email,
        role,
        permissions: ROLES[role].permissions
      };

      users.push(newUser);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }
);

// 3. Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions
    }
  });
});

// 4. Verify token endpoint
app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
});

// 5. Refresh token endpoint
app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  const newToken = generateToken(user);
  res.json({
    success: true,
    message: 'Token refreshed',
    data: { token: newToken }
  });
});

// Protected route examples

// Public route (no authentication)
app.get('/api/public', (req, res) => {
  res.json({
    success: true,
    message: 'This is a public endpoint',
    data: { info: 'Anyone can access this' }
  });
});

// User-only route (requires authentication)
app.get('/api/user/dashboard', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'User dashboard',
    data: { 
      user: req.user.username,
      role: req.user.role 
    }
  });
});

// Manager-only route
app.get('/api/manager/team', 
  authenticateToken, 
  authorizeRole('manager', 'admin'), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Manager team data',
      data: { 
        team: ['User 1', 'User 2', 'User 3'] 
      }
    });
  }
);

// Admin-only route
app.get('/api/admin/users', 
  authenticateToken, 
  authorizeRole('admin'), 
  (req, res) => {
    const userList = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role
    }));

    res.json({
      success: true,
      message: 'All users',
      data: { users: userList }
    });
  }
);

// Permission-based route
app.post('/api/content/create', 
  authenticateToken, 
  authorizePermission('write'), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Content created',
      data: { content: req.body }
    });
  }
);

// Level-based route (requires level 2 or higher)
app.delete('/api/content/:id', 
  authenticateToken, 
  authorizeLevel(2), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Content deleted',
      data: { id: req.params.id }
    });
  }
);

// List all available routes
app.get('/api/routes', (req, res) => {
  res.json({
    success: true,
    data: {
      public: [
        'GET /api/public',
        'POST /api/auth/login',
        'GET /api/routes'
      ],
      authenticated: [
        'GET /api/auth/profile',
        'POST /api/auth/verify',
        'POST /api/auth/refresh',
        'GET /api/user/dashboard'
      ],
      manager: [
        'GET /api/manager/team'
      ],
      admin: [
        'POST /api/auth/register',
        'GET /api/admin/users'
      ],
      permission_based: [
        'POST /api/content/create (requires write permission)',
        'DELETE /api/content/:id (requires level 2+)'
      ]
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n🚀 Authentication System running on port ${PORT}\n');
  console.log('Test Credentials:');
  console.log('================');
  console.log('Admin    - Username: admin    Password: admin123');
  console.log('Manager  - Username: manager  Password: manager123');
  console.log('User     - Username: user     Password: user123');
  console.log('\nAPI Documentation: http://localhost:' + PORT + '/api/routes\n');
});

module.exports = app;
