const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'FRONTEND_URL',
    'ALLOWED_ORIGINS',
];

const OPTIONAL_ENV_VARS = [
    'PORT',
    'BOOTSTRAP_SECRET',
    'EMAILJS_SERVICE_ID',
    'EMAILJS_TEMPLATE_ID',
    'EMAILJS_PUBLIC_KEY',
    'EMAILJS_PRIVATE_KEY',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_FROM',
    'GROQ_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'SENTRY_DSN',
    'ATTENDANCE_THRESHOLD',
    'CLUSTER_WORKERS',
    'CLUSTER_HEALTH_PORT',
    'NODE_ENV',
];

function validateEnv() {
    const missing = [];

    for (const key of REQUIRED_ENV_VARS) {
        if (!process.env[key] || process.env[key].startsWith('your_')) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('\n═══════════════════════════════════════════════════════════');
        console.error('  FATAL: Missing required environment variables');
        console.error('═══════════════════════════════════════════════════════════');
        for (const key of missing) {
            console.error(`  ✗ ${key} is not set`);
        }
        console.error('───────────────────────────────────────────────────────────');
        console.error('  Copy .env.example to .env and fill in your values:');
        console.error('    cp server/.env.example server/.env');
        console.error('═══════════════════════════════════════════════════════════\n');
        process.exit(1);
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.error('\n  FATAL: JWT_SECRET must be at least 32 characters long\n');
        process.exit(1);
    }

    if (process.env.NODE_ENV === 'production') {
        const secureOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
        for (const origin of secureOrigins) {
            const trimmed = origin.trim();
            if (trimmed.startsWith('http://') && !trimmed.startsWith('http://localhost')) {
                console.error(`\n  FATAL: Production CORS origin "${trimmed}" is not HTTPS\n`);
                process.exit(1);
            }
        }
    }

    if (process.env.BCRYPT_ROUNDS) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10);
        if (isNaN(rounds) || rounds < 10 || rounds > 16) {
            console.error('\n  FATAL: BCRYPT_ROUNDS must be between 10 and 16\n');
            process.exit(1);
        }
    }

    console.log('  ✓ Environment validation passed');
    return true;
}

function getEnvInfo() {
    const info = {};
    for (const key of REQUIRED_ENV_VARS) {
        info[key] = process.env[key] ? '✓ Set' : '✗ Missing';
    }
    for (const key of OPTIONAL_ENV_VARS) {
        if (process.env[key]) {
            info[key] = key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') || key.toLowerCase().includes('pass')
                ? '✓ Set (hidden)'
                : `✓ ${process.env[key].substring(0, 20)}...`;
        }
    }
    return info;
}

module.exports = { validateEnv, getEnvInfo, REQUIRED_ENV_VARS };
