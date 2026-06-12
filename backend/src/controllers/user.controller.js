const User = require('../models/User');

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: { users: [] },
      });
    }

    const searchQuery = q.trim();

    // Search by name or email (case-insensitive)
    const users = await User.find({
      $and: [
        { _id: { $ne: req.userId } }, // Exclude current user
        {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
          ],
        },
      ],
    })
      .select('name email avatar role')
      .limit(10)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchUsers,
};
