import { describe, it, expect } from 'vitest';
import { parse, format, validate, validateSchema, query, generateSchema } from './index.js';

function measure(fn: () => void, iterations = 100): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  return (performance.now() - start) / iterations;
}

function generateLargeLeanConfig(): string {
  const lines: string[] = [];
  lines.push('# LEAN Application Configuration');
  lines.push('# Generated for benchmark testing');
  lines.push('');

  lines.push('app:');
  lines.push('  name: "Benchmark App"');
  lines.push('  version: 3.2.1');
  lines.push('  description: "A comprehensive benchmark configuration file for testing LEAN format performance"');
  lines.push('  environment: production');
  lines.push('  debug: false');
  lines.push('  secret: null');
  lines.push('  allowed_origins:');
  lines.push('    - "https://app.example.com"');
  lines.push('    - "https://api.example.com"');
  lines.push('    - "https://admin.example.com"');
  lines.push('');

  lines.push('server:');
  lines.push('  host: 0.0.0.0');
  lines.push('  port: 8080');
  lines.push('  protocol: https');
  lines.push('  ssl:');
  lines.push('    enabled: true');
  lines.push('    cert_path: "/etc/ssl/certs/server.crt"');
  lines.push('    key_path: "/etc/ssl/private/server.key"');
  lines.push('    ca_bundle: "/etc/ssl/certs/ca.crt"');
  lines.push('  timeout: 30000');
  lines.push('  max_connections: 1000');
  lines.push('  rate_limit:');
  lines.push('    window_ms: 60000');
  lines.push('    max_requests: 100');
  lines.push('    ban_duration_ms: 300000');
  lines.push('');

  lines.push('database:');
  lines.push('  driver: postgresql');
  lines.push('  host: db.internal');
  lines.push('  port: 5432');
  lines.push('  name: benchmark_db');
  lines.push('  user: app_user');
  lines.push('  password: "s3cur3-p@ssw0rd"');
  lines.push('  pool:');
  lines.push('    min: 5');
  lines.push('    max: 50');
  lines.push('    acquire_timeout_ms: 10000');
  lines.push('    idle_timeout_ms: 300000');
  lines.push('  ssl:');
  lines.push('    mode: verify-full');
  lines.push('    ca: "/etc/ssl/db/ca.pem"');
  lines.push('  migrations:');
  lines.push('    directory: "./migrations"');
  lines.push('    table: schema_migrations');
  lines.push('    auto_upgrade: false');
  lines.push('');

  lines.push('cache:');
  lines.push('  backend: redis');
  lines.push('  host: redis.internal');
  lines.push('  port: 6379');
  lines.push('  password: null');
  lines.push('  db: 0');
  lines.push('  prefix: "benchmark:"');
  lines.push('  ttl_ms: 3600000');
  lines.push('  cluster:');
  lines.push('    enabled: false');
  lines.push('    nodes:');
  lines.push('      - "redis-1.internal:6379"');
  lines.push('      - "redis-2.internal:6379"');
  lines.push('      - "redis-3.internal:6379"');
  lines.push('');

  lines.push('logging:');
  lines.push('  level: info');
  lines.push('  format: json');
  lines.push('  output: stdout');
  lines.push('  file: "/var/log/app/benchmark.log"');
  lines.push('  max_size_mb: 100');
  lines.push('  max_backups: 7');
  lines.push('  max_age_days: 30');
  lines.push('  compress: true');
  lines.push('  sinks:');
  lines.push('    - console');
  lines.push('    - file');
  lines.push('    - syslog');
  lines.push('');

  lines.push('auth:');
  lines.push('  jwt:');
  lines.push('    secret: "benchmark-jwt-secret-key-2024"');
  lines.push('    algorithm: HS256');
  lines.push('    access_token_ttl_min: 15');
  lines.push('    refresh_token_ttl_days: 7');
  lines.push('    issuer: "benchmark-app"');
  lines.push('  oauth:');
  lines.push('    providers:');
  lines.push('      - google');
  lines.push('      - github');
  lines.push('      - microsoft');
  lines.push('    callback_url: "https://app.example.com/auth/callback"');
  lines.push('  mfa:');
  lines.push('    enabled: true');
  lines.push('    methods:');
  lines.push('      - totp');
  lines.push('      - sms');
  lines.push('');

  lines.push('features:');
  lines.push('  dark_mode: true');
  lines.push('  beta_features: false');
  lines.push('  analytics: true');
  lines.push('  notifications:');
  lines.push('    email: true');
  lines.push('    push: true');
  lines.push('    sms: false');
  lines.push('    webhook:');
  lines.push('      url: "https://hooks.example.com/events"');
  lines.push('      retry_count: 3');
  lines.push('      timeout_ms: 5000');
  lines.push('');

  lines.push('users(id, name, email, role, active):');
  lines.push('  - 1, "Alice Smith", "alice@example.com", admin, true');
  lines.push('  - 2, "Bob Johnson", "bob@example.com", user, true');
  lines.push('  - 3, "Casey Williams", "casey@example.com", user, true');
  lines.push('  - 4, "Diana Brown", "diana@example.com", moderator, true');
  lines.push('  - 5, "Edward Davis", "edward@example.com", user, false');
  lines.push('  - 6, "Fiona Miller", "fiona@example.com", user, true');
  lines.push('  - 7, "George Wilson", "george@example.com", admin, true');
  lines.push('  - 8, "Hannah Moore", "hannah@example.com", user, true');
  lines.push('');

  lines.push('products(id, name, price, category, in_stock):');
  lines.push('  - 101, "Widget Alpha", 9.99, widgets, true');
  lines.push('  - 102, "Widget Beta", 14.99, widgets, true');
  lines.push('  - 103, "Gadget Gamma", 24.99, gadgets, true');
  lines.push('  - 104, "Gadget Delta", 39.99, gadgets, false');
  lines.push('  - 105, "Tool Epsilon", 19.99, tools, true');
  lines.push('  - 106, "Tool Zeta", 49.99, tools, true');
  lines.push('  - 107, "Accessory Eta", 5.99, accessories, true');
  lines.push('  - 108, "Accessory Theta", 7.99, accessories, true');
  lines.push('');

  lines.push('monitoring:');
  lines.push('  metrics:');
  lines.push('    enabled: true');
  lines.push('    endpoint: "/metrics"');
  lines.push('    port: 9090');
  lines.push('  alerts:');
  lines.push('    cpu_threshold_pct: 90');
  lines.push('    memory_threshold_pct: 85');
  lines.push('    disk_threshold_pct: 80');
  lines.push('    channels:');
  lines.push('      - email');
  lines.push('      - slack');
  lines.push('      - pagerduty');
  lines.push('  tracing:');
  lines.push('    provider: jaeger');
  lines.push('    endpoint: "http://jaeger:14268/api/traces"');
  lines.push('    sample_rate: 0.1');
  lines.push('');

  lines.push('# End of configuration');
  return lines.join('\n');
}

function generateLargeObject(): Record<string, unknown> {
  const users = [];
  for (let i = 1; i <= 50; i++) {
    users.push({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: i % 3 === 0 ? 'admin' : 'user',
      active: i % 7 !== 0,
      score: Math.random() * 100,
    });
  }

  return {
    app: {
      name: 'Large Object Benchmark',
      version: '5.0.0',
      description: 'A large test object for benchmarking',
      debug: false,
      environment: 'testing',
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      ssl: { enabled: true },
      timeout: 30000,
    },
    users,
    settings: {
      theme: 'dark',
      locale: 'en-US',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
      display: {
        items_per_page: 50,
        sort_order: 'desc',
        density: 'comfortable',
      },
    },
    features: {
      beta: false,
      experimental: [],
      labs: ['new-ui', 'voice-control', 'dark-mode-v2'],
    },
  };
}

const leanConfig = generateLargeLeanConfig();
const largeObject = generateLargeObject();
const schema = generateSchema(largeObject);

describe('Benchmark: Parse', () => {
  it('parses a 150+ line LEAN config in under 50ms avg', () => {
    const avg = measure(() => { parse(leanConfig); }, 50);
    expect(avg).toBeLessThan(50);
  });

  it('parses large object round-trip format in under 100ms avg', () => {
    const formatted = format(largeObject);
    const avg = measure(() => { parse(formatted); }, 30);
    expect(avg).toBeLessThan(100);
  });

  it('handles worst-case deeply nested input in under 20ms', () => {
    const deep = 'a:\n' + '  b:\n' + '    c:\n' + '      d:\n' + '        e: deep\n';
    const avg = measure(() => { parse(deep); }, 200);
    expect(avg).toBeLessThan(20);
  });
});

describe('Benchmark: Format', () => {
  it('formats a large object to LEAN in under 50ms avg', () => {
    const avg = measure(() => { format(largeObject); }, 30);
    expect(avg).toBeLessThan(50);
  });

  it('formats with row syntax in under 50ms avg', () => {
    const data = {
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
      })),
    };
    const avg = measure(() => { format(data, { rowThreshold: 4, useRowSyntax: true }); }, 20);
    expect(avg).toBeLessThan(50);
  });

  it('formats with sort keys in under 50ms avg', () => {
    const unsorted: Record<string, number> = {};
    for (let i = 100; i >= 0; i--) unsorted[`key_${i}`] = i;
    const avg = measure(() => { format(unsorted, { sortKeys: true }); }, 20);
    expect(avg).toBeLessThan(50);
  });
});

describe('Benchmark: Round-trip', () => {
  it('parse → format → parse round-trip in under 100ms avg', () => {
    const avg = measure(() => {
      const obj = parse(leanConfig);
      const lean = format(obj);
      parse(lean);
    }, 20);
    expect(avg).toBeLessThan(100);
  });
});

describe('Benchmark: Schema Validation', () => {
  it('validates data against schema in under 10ms avg', () => {
    const avg = measure(() => {
      validateSchema(largeObject, schema);
    }, 50);
    expect(avg).toBeLessThan(10);
  });

  it('validates LEAN syntax in under 50ms avg', () => {
    const avg = measure(() => {
      validate(leanConfig);
    }, 50);
    expect(avg).toBeLessThan(50);
  });
});

describe('Benchmark: Query', () => {
  it('queries top-level key in under 1ms avg', () => {
    const data = parse(leanConfig) as Record<string, unknown>;
    const avg = measure(() => { query(data, 'app'); }, 500);
    expect(avg).toBeLessThan(1);
  });

  it('queries deeply nested key in under 1ms avg', () => {
    const data = parse(leanConfig) as Record<string, unknown>;
    const avg = measure(() => { query(data, 'server.ssl.enabled'); }, 500);
    expect(avg).toBeLessThan(1);
  });

  it('queries array index in under 1ms avg', () => {
    const data = parse(leanConfig) as Record<string, unknown>;
    const avg = measure(() => { query(data, 'users[3].name'); }, 500);
    expect(avg).toBeLessThan(1);
  });

  it('queries non-existent path returns quickly in under 1ms avg', () => {
    const data = parse(leanConfig) as Record<string, unknown>;
    const avg = measure(() => { query(data, 'nonexistent.deep.path'); }, 500);
    expect(avg).toBeLessThan(1);
  });
});
