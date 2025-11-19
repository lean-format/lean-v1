project: name: "My Project"
version: 1
active: true
tags:
  - demo
  - example
  - lean

users(id, name, email, age):
  - 1, Alice, alice@example.com, 30
  - 2, Bob, bob@example.com, 25
  - 3, Casey, casey@example.com, 28
blog: title: "My Blog"
author: name: Alice
email: alice@example.com

posts:
  -
    id: 1
    title: "First Post"
    content: "Hello, world!"
  -
    id: 2
    title: "Second Post"
    content: "Another post"
tags:
  - tech
  - programming
  - blog

config: debug: false
timeout: 5000
features: api: true
cache: true
logging: false