const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const ChatMessage = require('../models/ChatMessage');

/**
 * Admin oversight (Weeks 7-8). Every handler sits behind requireAdmin
 * (middleware/workspace.js). Admins see and manage users and workspaces
 * across the whole platform; regular users never reach these handlers.
 */

/**
 * List all users with plan, status and usage.
 * GET /api/admin/users
 */
async function listUsers(req, res) {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 100, 500));
    const users = await User.find({})
      .select('name email role status plan subscriptionStatus stripeCustomerId usage currentPeriodEnd createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.status(200).json({
      statusCode: 200,
      data: { users, total: users.length },
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to list users', error: error.message });
  }
}

/**
 * List all workspaces with owner and member counts.
 * GET /api/admin/workspaces
 */
async function listWorkspaces(req, res) {
  try {
    const workspaces = await Workspace.find({})
      .populate('owner', 'name email plan')
      .sort({ createdAt: -1 })
      .lean();
    const data = workspaces.map((w) => ({ ...w, memberCount: w.members.length }));
    return res.status(200).json({
      statusCode: 200,
      data: { workspaces: data, total: data.length },
      message: 'Workspaces retrieved successfully',
    });
  } catch (error) {
    console.error('Admin list workspaces error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to list workspaces', error: error.message });
  }
}

/**
 * Suspend or reactivate an account.
 * PATCH /api/admin/users/:id/suspend
 * Body: { suspended: true } suspends, { suspended: false } reactivates.
 * With no body value, the current status is toggled. An admin cannot
 * suspend their own account. Suspended users are blocked at login and on
 * every authenticated request (see middleware/auth.js).
 */
async function suspendUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ statusCode: 404, message: 'User not found' });
    }
    if (id.toString() === req.user.userId.toString()) {
      return res.status(400).json({ statusCode: 400, message: 'You cannot suspend your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ statusCode: 404, message: 'User not found' });
    }

    const requested = req.body && req.body.suspended;
    const suspend = typeof requested === 'boolean' ? requested : user.status !== 'suspended';
    user.status = suspend ? 'suspended' : 'active';
    await user.save();

    return res.status(200).json({
      statusCode: 200,
      data: { user: user.toJSON() },
      message: suspend ? 'User suspended' : 'User reactivated',
    });
  } catch (error) {
    console.error('Admin suspend user error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to update user status', error: error.message });
  }
}

/**
 * Platform analytics for the last 30 days.
 * GET /api/admin/analytics
 *
 * - messagesPerDay: user messages sent per day (chat turns)
 * - dailyActiveUsers: distinct users who sent at least one message per day
 * - planDistribution: users per plan
 * - subscriptions: users per subscription status, plus active vs cancelled
 */
async function getAnalytics(req, res) {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dayString = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const [messagesPerDay, activeRows, planRows, statusRows] = await Promise.all([
      ChatMessage.aggregate([
        { $match: { role: 'user', createdAt: { $gte: since } } },
        { $group: { _id: dayString, messages: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      ChatMessage.aggregate([
        { $match: { role: 'user', createdAt: { $gte: since } } },
        {
          $lookup: {
            from: 'chatsessions',
            localField: 'session',
            foreignField: '_id',
            as: 'sessionDoc',
          },
        },
        { $unwind: '$sessionDoc' },
        { $group: { _id: { day: dayString, user: '$sessionDoc.owner' } } },
        { $group: { _id: '$_id.day', activeUsers: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([{ $group: { _id: '$plan', users: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$subscriptionStatus', users: { $sum: 1 } } }]),
    ]);

    const planDistribution = {};
    for (const row of planRows) planDistribution[row._id] = row.users;

    const byStatus = {};
    for (const row of statusRows) byStatus[row._id] = row.users;

    return res.status(200).json({
      statusCode: 200,
      data: {
        windowDays: 30,
        messagesPerDay: messagesPerDay.map((r) => ({ date: r._id, messages: r.messages })),
        dailyActiveUsers: activeRows.map((r) => ({ date: r._id, activeUsers: r.activeUsers })),
        planDistribution,
        subscriptions: {
          byStatus,
          active: byStatus.active || 0,
          cancelled: byStatus.canceled || 0,
        },
      },
      message: 'Analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to compute analytics', error: error.message });
  }
}

module.exports = {
  listUsers,
  listWorkspaces,
  suspendUser,
  getAnalytics,
};
