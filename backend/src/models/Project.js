const mongoose = require('mongoose');
const { v4: uuidv4 } = require('crypto');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor',
    },
  },
  { _id: false }
);

const columnSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    columns: [columnSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Default columns for new projects
projectSchema.pre('save', function (next) {
  if (this.isNew && this.columns.length === 0) {
    this.columns = [
      { id: generateId(), title: 'Todo', order: 0 },
      { id: generateId(), title: 'In Progress', order: 1 },
      { id: generateId(), title: 'Review', order: 2 },
      { id: generateId(), title: 'Done', order: 3 },
    ];
  }
  // Ensure owner is in members list
  if (this.isNew) {
    const ownerInMembers = this.members.some(
      (m) => m.user.toString() === this.owner.toString()
    );
    if (!ownerInMembers) {
      this.members.push({ user: this.owner, role: 'owner' });
    }
  }
  next();
});

// Index for fast member lookup
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ owner: 1 });

function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

module.exports = mongoose.model('Project', projectSchema);
