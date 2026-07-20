const ALLOWED_MIME_TYPES = {
    assignment: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp'
    ],
    material: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/webp'
    ],
    signature: [
        'image/png',
        'image/jpeg',
        'image/webp'
    ],
    excel: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ]
};

const ALLOWED_EXTENSIONS = {
    assignment: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'],
    material: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp'],
    signature: ['png', 'jpg', 'jpeg', 'webp'],
    excel: ['xlsx', 'xls', 'csv']
};

const MAX_FILE_SIZES = {
    assignment: 10 * 1024 * 1024, // 10MB
    material: 20 * 1024 * 1024,   // 20MB
    signature: 2 * 1024 * 1024,   // 2MB
    excel: 5 * 1024 * 1024        // 5MB
};

const DANGEROUS_EXTENSIONS = [
    'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'vbs', 'vbe',
    'js', 'jse', 'wsf', 'wsh', 'ps1', 'psm1', 'psd1',
    'sh', 'bash', 'pl', 'py', 'rb', 'jar', 'war',
    'htm', 'html', 'shtml', 'php', 'php3', 'php4', 'php5', 'phtml',
    'asp', 'aspx', 'cgi', 'cfm', 'cfc'
];

function validateFileType(filename, mimetype, category = 'assignment') {
    const errors = [];

    // Check if filename was provided
    if (!filename) {
        errors.push('File name is required');
        return { valid: false, errors };
    }

    // Check extension
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (!ext) {
        errors.push('File must have an extension');
        return { valid: false, errors };
    }

    // Block dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
        errors.push(`File type '.${ext}' is not allowed for security reasons`);
        return { valid: false, errors };
    }

    // Check allowed extensions for category
    const allowedExts = ALLOWED_EXTENSIONS[category];
    if (allowedExts && !allowedExts.includes(ext)) {
        errors.push(`Invalid file type '.${ext}'. Allowed types: ${allowedExts.join(', ')}`);
    }

    // Check allowed MIME types for category
    const allowedMimes = ALLOWED_MIME_TYPES[category];
    if (allowedMimes && mimetype && !allowedMimes.includes(mimetype)) {
        // Don't reject based on MIME alone (can be spoofed), but note it
        if (errors.length === 0) {
            // Only add if no other errors — MIME is secondary check
        }
    }

    // Double extension check (e.g., file.pdf.exe)
    const baseName = filename.replace(new RegExp(`\\.${ext}$`), '');
    const baseExt = baseName.split('.').pop()?.toLowerCase();
    if (baseExt && DANGEROUS_EXTENSIONS.includes(baseExt)) {
        errors.push('Suspicious file name detected');
    }

    return { valid: errors.length === 0, errors };
}

function validateFileSize(size, category = 'assignment') {
    const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.assignment;
    if (size > maxSize) {
        const maxMB = Math.round(maxSize / 1024 / 1024);
        return {
            valid: false,
            error: `File size exceeds the maximum allowed limit of ${maxMB}MB.`
        };
    }
    return { valid: true };
}

function getSafeFileName(originalName, prefix = 'file') {
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const safeExt = ALLOWED_EXTENSIONS.assignment.includes(ext) ? ext : 'bin';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.${safeExt}`;
}

module.exports = {
    validateFileType,
    validateFileSize,
    getSafeFileName,
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZES
};
