class Todo
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :user
  index({ user_id: 1 })

  field :title, type: String
  field :description, type: String
  field :completed, type: Boolean, default: false
  field :due_date, type: Time
  field :reminder_at, type: Time
  field :priority, type: String, default: "medium"

  PRIORITY_TO_COLOR = {
    "low" => "#16a34a",     # green
    "medium" => "#2563eb",  # blue
    "high" => "#f59e0b",    # amber
    "urgent" => "#dc2626"    # red
  }.freeze

  validates :title, presence: true
  validates :priority, inclusion: { in: PRIORITY_TO_COLOR.keys }

  def overdue?
    return false if completed
    return false if due_date.nil?
    Time.now.utc > due_date
  end

  def priority_color
    PRIORITY_TO_COLOR[priority]
  end

  def as_json(options = {})
    super(options).merge(
      {
        "overdue" => overdue?,
        "priority_color" => priority_color
      }
    )
  end
end
