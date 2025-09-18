puts "Seeding sample data..."

User.delete_all
Todo.delete_all

users = [
  { email: "alice@example.com", password: "password", password_confirmation: "password" },
  { email: "bob@example.com", password: "password", password_confirmation: "password" }
].map do |attrs|
  User.create!(attrs)
end

now = Time.now.utc

def make_todo(user, title:, description: nil, completed: false, due_offset_hours: nil, reminder_offset_hours: nil, priority: "medium")
  due_date = due_offset_hours.nil? ? nil : (Time.now.utc + due_offset_hours * 3600)
  reminder_at = reminder_offset_hours.nil? ? nil : (Time.now.utc + reminder_offset_hours * 3600)
  user.todos.create!(
    title: title,
    description: description,
    completed: completed,
    due_date: due_date,
    reminder_at: reminder_at,
    priority: priority
  )
end

alice, bob = users

# Alice's todos
make_todo(alice, title: "Buy groceries", description: "Milk, eggs, bread", due_offset_hours: 24, reminder_offset_hours: 12, priority: "medium")
make_todo(alice, title: "Finish report", description: "Quarterly metrics", due_offset_hours: -6, reminder_offset_hours: -12, priority: "high")
make_todo(alice, title: "Plan weekend trip", description: "Book hotel", completed: true, priority: "low")

# Bob's todos
make_todo(bob, title: "Call plumber", description: "Leak in kitchen", due_offset_hours: 6, reminder_offset_hours: 1, priority: "urgent")
make_todo(bob, title: "Gym session", description: "Leg day", priority: "medium")

puts "Seeded #{User.count} users and #{Todo.count} todos."


