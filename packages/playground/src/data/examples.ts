export const PLAYGROUND_EXAMPLE = `model User {
  id: ID
  name: String
  email: String
  age: Number
  role: Role
}

enum Role {
  Admin
  Editor
  Viewer
}

relation User->Post {
  author: -> Post
}

model Post {
  id: ID
  title: String
  content: String
  authorId: ID
  createdAt: Date
}

constraint PostTitle {
  minLength: 1
  maxLength: 200
}`;

export const SCHEMA_EXAMPLE = `model Product {
  sku: ID
  name: String
  price: Number
  category: Category
  tags: [String]
  inStock: Boolean
}

enum Category {
  Electronics
  Clothing
  Food
  Books
}

model Order {
  id: ID
  userId: ID
  items: [OrderItem]
  total: Number
  status: OrderStatus
  createdAt: Date
}

enum OrderStatus {
  Pending
  Shipped
  Delivered
  Cancelled
}

model OrderItem {
  productId: ID
  quantity: Number
  price: Number
}

relation Product->OrderItem {
  product: -> OrderItem
}`;

export const QUERY_EXAMPLE = `// Find all users with role Admin
model User {
  id: ID
  name: String
  email: String
  role: Role
}

// Filter: role = "Admin"
// Select: name, email

// Expected SQL-like output:
// SELECT User.name, User.email
// FROM User
// WHERE User.role = "Admin"`;

export const DIFF_EXAMPLE_LEFT = `model User {
  id: ID
  name: String
  email: String
  age: Number
}

model Post {
  id: ID
  title: String
  body: String
  authorId: ID
}`;

export const DIFF_EXAMPLE_RIGHT = `model User {
  id: ID
  name: String
  email: String
  age: Number
  role: Role
}

enum Role {
  Admin
  User
  Guest
}

model Post {
  id: ID
  title: String
  content: String
  authorId: ID
  published: Boolean
}`;
