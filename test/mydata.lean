# Sample LEAN file
# This demonstrates the LEAN format features

project:
    name: "My Project"
    version: 1.0
    active: true
    tags:
        - demo
        - example
        - lean

# Users with row syntax (compact tabular data)
users(id, name, email, age):
    - 1, Alice, alice@example.com, 30
    - 2, Bob, bob@example.com, 25
    - 3, Casey, casey@example.com, 28

# Tasks with nested structure
blog:
    title: "My Blog"
    author:
        name: Alice
        email: alice@example.com
    posts(id, title, content):
        - 1, "First Post", "Hello, world!"
        - 2, "Second Post", "Another post"
    tags:
        - tech
        - programming
        - blog

# Configuration
config:
    debug: false
    timeout: 5000
    features:
        api: true
        cache: true
        logging: false
