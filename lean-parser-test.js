/**
 * LEAN Format Test Suite
 * Comprehensive tests for LEAN parser and serializer
 */

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running LEAN Test Suite\n');
    
    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.passed++;
        console.log(`✅ ${name}`);
      } catch (error) {
        this.failed++;
        console.log(`❌ ${name}`);
        console.log(`   ${error.message}\n`);
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

function assertEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual, null, 2);
  const expectedStr = JSON.stringify(expected, null, 2);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
  }
}

function assertThrows(fn, message = '') {
  try {
    fn();
    throw new Error(`Expected function to throw, but it didn't. ${message}`);
  } catch (error) {
    if (error.message.includes('Expected function to throw')) {
      throw error;
    }
    // Expected to throw
  }
}

// Initialize test runner
const runner = new TestRunner();

// ============================================================================
// BASIC VALUE TYPES
// ============================================================================

runner.test('Parse unquoted string', () => {
  const lean = 'name: Alice';
  const result = parseLean(lean);
  assertEqual(result, { name: 'Alice' });
});

runner.test('Parse quoted string', () => {
  const lean = 'message: "Hello, world!"';
  const result = parseLean(lean);
  assertEqual(result, { message: 'Hello, world!' });
});

runner.test('Parse string with escaped quotes', () => {
  const lean = 'quote: "She said \\"hello\\""';
  const result = parseLean(lean);
  assertEqual(result, { quote: 'She said "hello"' });
});

runner.test('Parse integer', () => {
  const lean = 'age: 30';
  const result = parseLean(lean);
  assertEqual(result, { age: 30 });
});

runner.test('Parse negative integer', () => {
  const lean = 'temp: -5';
  const result = parseLean(lean);
  assertEqual(result, { temp: -5 });
});

runner.test('Parse float', () => {
  const lean = 'price: 19.99';
  const result = parseLean(lean);
  assertEqual(result, { price: 19.99 });
});

runner.test('Parse scientific notation', () => {
  const lean = 'large: 1.5e10';
  const result = parseLean(lean);
  assertEqual(result, { large: 1.5e10 });
});

runner.test('Parse boolean true', () => {
  const lean = 'active: true';
  const result = parseLean(lean);
  assertEqual(result, { active: true });
});

runner.test('Parse boolean false', () => {
  const lean = 'deleted: false';
  const result = parseLean(lean);
  assertEqual(result, { deleted: false });
});

runner.test('Parse null', () => {
  const lean = 'value: null';
  const result = parseLean(lean);
  assertEqual(result, { value: null });
});

// ============================================================================
// OBJECTS
// ============================================================================

runner.test('Parse simple object', () => {
  const lean = `
user:
    name: Alice
    age: 30
`;
  const result = parseLean(lean);
  assertEqual(result, {
    user: {
      name: 'Alice',
      age: 30
    }
  });
});

runner.test('Parse nested object', () => {
  const lean = `
user:
    name: Alice
    address:
        city: Boston
        zip: 02101
`;
  const result = parseLean(lean);
  assertEqual(result, {
    user: {
      name: 'Alice',
      address: {
        city: 'Boston',
        zip: 2101
      }
    }
  });
});

runner.test('Parse multiple top-level keys', () => {
  const lean = `
name: Alice
age: 30
city: Boston
`;
  const result = parseLean(lean);
  assertEqual(result, {
    name: 'Alice',
    age: 30,
    city: 'Boston'
  });
});

runner.test('Parse empty object', () => {
  const lean = 'user:';
  const result = parseLean(lean);
  assertEqual(result, { user: null });
});

// ============================================================================
// LISTS
// ============================================================================

runner.test('Parse simple list', () => {
  const lean = `
tags:
    - news
    - tech
    - science
`;
  const result = parseLean(lean);
  assertEqual(result, {
    tags: ['news', 'tech', 'science']
  });
});

runner.test('Parse list of numbers', () => {
  const lean = `
scores:
    - 95
    - 87
    - 92
`;
  const result = parseLean(lean);
  assertEqual(result, {
    scores: [95, 87, 92]
  });
});

runner.test('Parse mixed list', () => {
  const lean = `
items:
    - Alice
    - 42
    - true
    - null
`;
  const result = parseLean(lean);
  assertEqual(result, {
    items: ['Alice', 42, true, null]
  });
});

runner.test('Parse list of objects', () => {
  const lean = `
users:
    - name: Alice
      age: 30
    - name: Bob
      age: 25
`;
  const result = parseLean(lean);
  assertEqual(result, {
    users: [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ]
  });
});

runner.test('Parse empty list', () => {
  const lean = 'items:';
  const result = parseLean(lean);
  assertEqual(result, { items: null });
});

// ============================================================================
// ROW SYNTAX
// ============================================================================

runner.test('Parse basic row syntax', () => {
  const lean = `
users(id, name, age):
    - 1, Alice, 30
    - 2, Bob, 25
`;
  const result = parseLean(lean);
  assertEqual(result, {
    users: [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ]
  });
});

runner.test('Parse row syntax with quoted strings', () => {
  const lean = `
products(id, name):
    - 1, "Super Widget"
    - 2, "Mega Gadget"
`;
  const result = parseLean(lean);
  assertEqual(result, {
    products: [
      { id: 1, name: 'Super Widget' },
      { id: 2, name: 'Mega Gadget' }
    ]
  });
});

runner.test('Parse row syntax with missing values', () => {
  const lean = `
records(id, name, age):
    - 1, Alice, 30
    - 2, Bob
    - 3, Casey, 28
`;
  const result = parseLean(lean);
  assertEqual(result, {
    records: [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: null },
      { id: 3, name: 'Casey', age: 28 }
    ]
  });
});

runner.test('Parse row syntax with all types', () => {
  const lean = `
data(str, num, bool, nul):
    - hello, 42, true, null
    - world, 3.14, false, null
`;
  const result = parseLean(lean);
  assertEqual(result, {
    data: [
      { str: 'hello', num: 42, bool: true, nul: null },
      { str: 'world', num: 3.14, bool: false, nul: null }
    ]
  });
});

runner.test('Parse single column row syntax', () => {
  const lean = `
ids(value):
    - 1
    - 2
    - 3
`;
  const result = parseLean(lean);
  assertEqual(result, {
    ids: [
      { value: 1 },
      { value: 2 },
      { value: 3 }
    ]
  });
});

runner.test('Parse empty row list', () => {
  const lean = 'users(id, name):';
  const result = parseLean(lean);
  assertEqual(result, { users: [] });
});

runner.test('Parse row with commas in quoted strings', () => {
  const lean = `
items(id, desc):
    - 1, "Item, with comma"
    - 2, "Another, item"
`;
  const result = parseLean(lean);
  assertEqual(result, {
    items: [
      { id: 1, desc: 'Item, with comma' },
      { id: 2, desc: 'Another, item' }
    ]
  });
});

// ============================================================================
// NESTED STRUCTURES
// ============================================================================

runner.test('Parse nested object with list', () => {
  const lean = `
user:
    name: Alice
    tags:
        - admin
        - verified
`;
  const result = parseLean(lean);
  assertEqual(result, {
    user: {
      name: 'Alice',
      tags: ['admin', 'verified']
    }
  });
});

runner.test('Parse nested object with row syntax', () => {
  const lean = `
store:
    name: TechShop
    products(id, name):
        - 1, Widget
        - 2, Gadget
`;
  const result = parseLean(lean);
  assertEqual(result, {
    store: {
      name: 'TechShop',
      products: [
        { id: 1, name: 'Widget' },
        { id: 2, name: 'Gadget' }
      ]
    }
  });
});

runner.test('Parse complex nested structure', () => {
  const lean = `
blog:
    title: "My Blog"
    tags:
        - tech
        - coding
    posts(id, title):
        - 1, "First Post"
        - 2, "Second Post"
    comments(postId, user, text):
        - 1, Alice, "Great!"
        - 1, Bob, "Nice"
        - 2, Casey, "Interesting"
`;
  const result = parseLean(lean);
  assertEqual(result, {
    blog: {
      title: 'My Blog',
      tags: ['tech', 'coding'],
      posts: [
        { id: 1, title: 'First Post' },
        { id: 2, title: 'Second Post' }
      ],
      comments: [
        { postId: 1, user: 'Alice', text: 'Great!' },
        { postId: 1, user: 'Bob', text: 'Nice' },
        { postId: 2, user: 'Casey', text: 'Interesting' }
      ]
    }
  });
});

// ============================================================================
// COMMENTS
// ============================================================================

runner.test('Parse line comment', () => {
  const lean = `
# This is a comment
name: Alice
`;
  const result = parseLean(lean);
  assertEqual(result, { name: 'Alice' });
});

runner.test('Parse inline comment', () => {
  const lean = 'name: Alice # This is Alice';
  const result = parseLean(lean);
  assertEqual(result, { name: 'Alice' });
});

runner.test('Parse multiple comments', () => {
  const lean = `
# Header comment
name: Alice
# Middle comment
age: 30
# End comment
`;
  const result = parseLean(lean);
  assertEqual(result, { name: 'Alice', age: 30 });
});

// ============================================================================
// WHITESPACE & INDENTATION
// ============================================================================

runner.test('Parse with 2-space indentation', () => {
  const lean = `
user:
  name: Alice
  age: 30
`;
  const result = parseLean(lean);
  assertEqual(result, {
    user: { name: 'Alice', age: 30 }
  });
});

runner.test('Parse with 4-space indentation', () => {
  const lean = `
user:
    name: Alice
    age: 30
`;
  const result = parseLean(lean);
  assertEqual(result, {
    user: { name: 'Alice', age: 30 }
  });
});

runner.test('Parse with tab indentation', () => {
  const lean = "user:\n\tname: Alice\n\tage: 30";
  const result = parseLean(lean);
  assertEqual(result, {
    user: { name: 'Alice', age: 30 }
  });
});

runner.test('Parse with blank lines', () => {
  const lean = `
name: Alice

age: 30

city: Boston
`;
  const result = parseLean(lean);
  assertEqual(result, {
    name: 'Alice',
    age: 30,
    city: 'Boston'
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

runner.test('Error on mixed indentation', () => {
  const lean = "user:\n  name: Alice\n\t age: 30";
  assertThrows(() => parseLean(lean), 'Should reject mixed indentation');
});

runner.test('Error on invalid key format', () => {
  const lean = '123invalid: value';
  assertThrows(() => parseLean(lean), 'Should reject invalid key');
});

runner.test('Error on unexpected indentation', () => {
  const lean = `
name: Alice
    invalid: indented
`;
  assertThrows(() => parseLean(lean), 'Should reject unexpected indentation');
});

runner.test('Strict mode: error on extra row values', () => {
  const lean = `
users(id, name):
    - 1, Alice, extra
`;
  assertThrows(
    () => parseLean(lean, { strict: true }),
    'Should reject extra values in strict mode'
  );
});

runner.test('Strict mode: error on duplicate keys', () => {
  const lean = `
name: Alice
name: Bob
`;
  assertThrows(
    () => parseLean(lean, { strict: true }),
    'Should reject duplicate keys in strict mode'
  );
});

// ============================================================================
// ROUND-TRIP CONVERSION
// ============================================================================

runner.test('Round-trip: simple object', () => {
  const obj = { name: 'Alice', age: 30 };
  const lean = toLean(obj);
  const parsed = parseLean(lean);
  assertEqual(parsed, obj);
});

runner.test('Round-trip: nested object', () => {
  const obj = {
    user: {
      name: 'Alice',
      address: {
        city: 'Boston',
        zip: 2101
      }
    }
  };
  const lean = toLean(obj);
  const parsed = parseLean(lean);
  assertEqual(parsed, obj);
});

runner.test('Round-trip: list', () => {
  const obj = {
    tags: ['news', 'tech', 'science']
  };
  const lean = toLean(obj);
  const parsed = parseLean(lean);
  assertEqual(parsed, obj);
});

runner.test('Round-trip: row syntax', () => {
  const obj = {
    users: [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
      { id: 3, name: 'Casey', age: 28 }
    ]
  };
  const lean = toLean(obj);
  const parsed = parseLean(lean);
  assertEqual(parsed, obj);
});

runner.test('Round-trip: complex structure', () => {
  const obj = {
    blog: {
      title: 'My Blog',
      author: 'Alice',
      tags: ['tech', 'coding'],
      posts: [
        { id: 1, title: 'First Post', date: '2025-01-15' },
        { id: 2, title: 'Second Post', date: '2025-02-01' },
        { id: 3, title: 'Third Post', date: '2025-02-15' }
      ]
    }
  };
  const lean = toLean(obj);
  const parsed = parseLean(lean);
  assertEqual(parsed, obj);
});

// ============================================================================
// SERIALIZATION OPTIONS
// ============================================================================

runner.test('toLean: use row syntax by default', () => {
  const obj = {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Casey' }
    ]
  };
  const lean = toLean(obj);
  const hasRowSyntax = lean.includes('users(id, name):');
  if (!hasRowSyntax) {
    throw new Error('Should use row syntax for uniform arrays');
  }
});

runner.test('toLean: disable row syntax', () => {
  const obj = {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Casey' }
    ]
  };
  const lean = toLean(obj, { useRowSyntax: false });
  const hasRowSyntax = lean.includes('users(id, name):');
  if (hasRowSyntax) {
    throw new Error('Should not use row syntax when disabled');
  }
});

runner.test('toLean: respect row threshold', () => {
  const obj = {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  };
  const lean = toLean(obj, { rowThreshold: 3 });
  const hasRowSyntax = lean.includes('users(id, name):');
  if (hasRowSyntax) {
    throw new Error('Should not use row syntax below threshold');
  }
});

// ============================================================================
// EDGE CASES
// ============================================================================

runner.test('Parse empty document', () => {
  const lean = '';
  const result = parseLean(lean);
  assertEqual(result, {});
});

runner.test('Parse document with only comments', () => {
  const lean = `
# Just comments
# Nothing else
`;
  const result = parseLean(lean);
  assertEqual(result, {});
});

runner.test('Parse key with special characters', () => {
  const lean = 'user_name: Alice';
  const result = parseLean(lean);
  assertEqual(result, { user_name: 'Alice' });
});

runner.test('Parse key with hyphen', () => {
  const lean = 'user-id: 42';
  const result = parseLean(lean);
  assertEqual(result, { 'user-id': 42 });
});

runner.test('Parse key with dollar sign', () => {
  const lean = '$special: value';
  const result = parseLean(lean);
  assertEqual(result, { $special: 'value' });
});

runner.test('Parse value that looks like keyword', () => {
  const lean = 'word: true';
  const result = parseLean(lean);
  assertEqual(result, { word: true });
});

runner.test('Parse string that looks like number', () => {
  const lean = 'code: "123"';
  const result = parseLean(lean);
  assertEqual(result, { code: '123' });
});

// ============================================================================
// RUN TESTS
// ============================================================================

// Run all tests
runner.run().then(success => {
  if (!success) {
    console.log('\n⚠️  Some tests failed');
  } else {
    console.log('\n🎉 All tests passed!');
  }
});
