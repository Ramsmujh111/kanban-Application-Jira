const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    column: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    labels: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
taskSchema.index({ project: 1, column: 1, order: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
